"""官方法规定时爬取 — 每周同步 NPC 种子到 Chroma。"""

from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.common.logger_util import logger

_RUNTIME_DIR = Path(__file__).resolve().parents[4] / "config" / "runtime"
_STATE_PATH = _RUNTIME_DIR / "knowledge_crawl_state.json"
_scheduler_task: asyncio.Task | None = None

DEFAULT_WEEKDAY = int(os.environ.get("KNOWLEDGE_CRAWL_WEEKDAY", "6"))  # 0=Mon … 6=Sun
DEFAULT_HOUR = int(os.environ.get("KNOWLEDGE_CRAWL_HOUR", "3"))
DEFAULT_MINUTE = int(os.environ.get("KNOWLEDGE_CRAWL_MINUTE", "0"))
DEFAULT_ENABLED = os.environ.get("KNOWLEDGE_CRAWL_SCHEDULE_ENABLED", "false").lower() in ("1", "true", "yes")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_runtime_dir() -> None:
    _RUNTIME_DIR.mkdir(parents=True, exist_ok=True)


def load_crawl_state() -> dict[str, Any]:
    _ensure_runtime_dir()
    if not _STATE_PATH.exists():
        return {}
    try:
        with open(_STATE_PATH, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_crawl_state(state: dict[str, Any]) -> None:
    _ensure_runtime_dir()
    with open(_STATE_PATH, "w", encoding="utf-8") as handle:
        json.dump(state, handle, ensure_ascii=False, indent=2)


def get_seen_bbbs() -> set[str]:
    state = load_crawl_state()
    raw = state.get("seen_bbbs") or []
    return {str(item) for item in raw if item}


def remember_bbbs(bbbs: str) -> None:
    if not bbbs:
        return
    state = load_crawl_state()
    seen = get_seen_bbbs()
    seen.add(str(bbbs))
    state["seen_bbbs"] = sorted(seen)
    save_crawl_state(state)


def is_schedule_enabled() -> bool:
    state = load_crawl_state()
    if "enabled" in state:
        return bool(state["enabled"])
    return DEFAULT_ENABLED


def compute_next_run(from_dt: datetime | None = None) -> datetime:
    now = from_dt or _utc_now()
    local = now.astimezone()
    days_ahead = (DEFAULT_WEEKDAY - local.weekday()) % 7
    candidate = local.replace(
        hour=DEFAULT_HOUR,
        minute=DEFAULT_MINUTE,
        second=0,
        microsecond=0,
    ) + timedelta(days=days_ahead)
    if candidate <= local:
        candidate += timedelta(days=7)
    return candidate.astimezone(timezone.utc)


def set_schedule_enabled(enabled: bool) -> dict[str, Any]:
    state = load_crawl_state()
    state["enabled"] = enabled
    state["next_run_at"] = compute_next_run().isoformat()
    save_crawl_state(state)
    return get_schedule_status()


def get_schedule_status() -> dict[str, Any]:
    state = load_crawl_state()
    next_run = state.get("next_run_at") or compute_next_run().isoformat()
    summary = state.get("last_run_summary") or {}
    return {
        "enabled": is_schedule_enabled(),
        "weekday": DEFAULT_WEEKDAY,
        "hour": DEFAULT_HOUR,
        "minute": DEFAULT_MINUTE,
        "lastRunAt": state.get("last_run_at"),
        "lastRunStatus": state.get("last_run_status"),
        "lastRunSummary": summary,
        "nextRunAt": next_run,
        "running": bool(state.get("running")),
        "seenBbbsCount": len(get_seen_bbbs()),
        "lastTaskBackfill": load_crawl_state().get("last_task_backfill"),
    }


def run_scheduled_crawl_sync(*, trigger: str = "schedule") -> dict[str, Any]:
    from cosight_server.deep_research.services.legal_kb.crawl_service import LegalCrawlService, load_crawl_seeds

    state = load_crawl_state()
    if state.get("running"):
        logger.info("Knowledge crawl already running, skip (%s)", trigger)
        return get_schedule_status()

    state["running"] = True
    save_crawl_state(state)

    summary: dict[str, Any] = {"trigger": trigger, "success": 0, "skipped": 0, "failed": 0, "total": 0}
    status = "success"

    try:
        config = load_crawl_seeds()
        all_seed_ids = [str(item.get("id")) for item in (config.get("seeds") or []) if item.get("id")]
        service = LegalCrawlService(seen_bbbs=get_seen_bbbs())
        result = service.run(seed_ids=all_seed_ids or None)
        for row in result.get("results") or []:
            summary["total"] += 1
            row_status = row.get("status")
            if row_status == "ingested":
                summary["success"] += 1
            elif row_status == "skipped":
                summary["skipped"] += 1
            else:
                summary["failed"] += 1
        for bbbs in result.get("seen_bbbs") or []:
            remember_bbbs(str(bbbs))
        if result.get("errors"):
            summary["errors"] = result["errors"]
            if summary["success"] == 0 and summary["skipped"] == 0:
                status = "failed"
            elif summary["failed"] > 0 or result["errors"]:
                status = "partial"
    except Exception as exc:
        logger.exception("Scheduled knowledge crawl failed: %s", exc)
        status = "failed"
        summary["error"] = str(exc)
    finally:
        state = load_crawl_state()
        state["running"] = False
        state["last_run_at"] = _utc_now().isoformat()
        state["last_run_status"] = status
        state["last_run_summary"] = summary
        state["next_run_at"] = compute_next_run().isoformat()
        save_crawl_state(state)

    logger.info("Scheduled knowledge crawl finished: %s", summary)
    return get_schedule_status()


async def run_scheduled_crawl(*, trigger: str = "schedule") -> dict[str, Any]:
    return await asyncio.to_thread(run_scheduled_crawl_sync, trigger=trigger)


async def _scheduler_loop() -> None:
    logger.info("Knowledge crawl scheduler started")
    while True:
        try:
            if not is_schedule_enabled():
                await asyncio.sleep(3600)
                continue

            state = load_crawl_state()
            next_raw = state.get("next_run_at")
            next_run = datetime.fromisoformat(next_raw) if next_raw else compute_next_run()
            if next_run.tzinfo is None:
                next_run = next_run.replace(tzinfo=timezone.utc)

            delay = (next_run - _utc_now()).total_seconds()
            if delay > 0:
                await asyncio.sleep(min(delay, 3600))
                continue

            await run_scheduled_crawl(trigger="schedule")
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            logger.info("Knowledge crawl scheduler cancelled")
            raise
        except Exception as exc:
            logger.warning("Scheduler loop error: %s", exc)
            await asyncio.sleep(300)


def start_scheduler() -> asyncio.Task | None:
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        return _scheduler_task

    state = load_crawl_state()
    if "next_run_at" not in state:
        state["next_run_at"] = compute_next_run().isoformat()
    if "enabled" not in state:
        state["enabled"] = DEFAULT_ENABLED
    save_crawl_state(state)

    _scheduler_task = asyncio.create_task(_scheduler_loop(), name="lexhub-knowledge-crawl-scheduler")
    return _scheduler_task


async def stop_scheduler() -> None:
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass
    _scheduler_task = None
