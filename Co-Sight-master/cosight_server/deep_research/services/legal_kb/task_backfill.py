"""任务结束后本地 0 命中时，自动按关键词 NPC 补爬。"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any

from app.common.logger_util import logger


def is_backfill_enabled() -> bool:
    return os.environ.get("KNOWLEDGE_TASK_BACKFILL_ENABLED", "true").lower() in ("1", "true", "yes")


def extract_crawl_keywords(query: str, *, max_keywords: int = 2) -> list[str]:
    query = (query or "").strip()
    if not query:
        return []

    keywords: list[str] = []
    for match in re.finditer(r"《([^》]{2,40})》", query):
        keywords.append(match.group(1).strip())
    for match in re.finditer(r"(中华人民共和国[^，。；\s?？!！]{2,30}法)", query):
        keywords.append(match.group(1).strip())

    if not keywords:
        segment = re.split(r"[，。；\n?？!！]", query)[0].strip()
        if len(segment) >= 4:
            keywords.append(segment[:40])

    seen: set[str] = set()
    out: list[str] = []
    for keyword in keywords:
        if not keyword or keyword in seen:
            continue
        seen.add(keyword)
        out.append(keyword)
        if len(out) >= max_keywords:
            break
    return out


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _remember_recent_keyword(keyword: str) -> None:
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import load_crawl_state, save_crawl_state

    state = load_crawl_state()
    recent = state.get("recent_backfill_keywords") or {}
    recent[keyword] = _utc_now().isoformat()
    state["recent_backfill_keywords"] = recent
    save_crawl_state(state)


def _was_recently_backfilled(keyword: str, *, cooldown_hours: int = 24) -> bool:
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import load_crawl_state

    state = load_crawl_state()
    recent = state.get("recent_backfill_keywords") or {}
    last_raw = recent.get(keyword)
    if not last_raw:
        return False
    try:
        last_dt = datetime.fromisoformat(str(last_raw))
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        return (_utc_now() - last_dt).total_seconds() < cooldown_hours * 3600
    except Exception:
        return False


def _save_task_backfill_record(plan_id: str, query: str, payload: dict[str, Any]) -> None:
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import load_crawl_state, save_crawl_state

    state = load_crawl_state()
    state["last_task_backfill"] = {
        "planId": plan_id,
        "query": query[:200],
        "at": _utc_now().isoformat(),
        **payload,
    }
    save_crawl_state(state)


def maybe_backfill_after_task(query: str, *, plan_id: str = "") -> dict[str, Any]:
    """任务完成后调用：本地 Chroma 无命中则尝试 NPC 关键词补爬。"""
    if not is_backfill_enabled():
        return {"status": "skipped", "reason": "disabled"}

    query = (query or "").strip()
    if len(query) < 4:
        return {"status": "skipped", "reason": "query_too_short"}

    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import get_seen_bbbs, remember_bbbs
    from cosight_server.deep_research.services.legal_kb.crawl_service import LegalCrawlService
    from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search

    search = hybrid_legal_search(query, limit=3)
    local_hits = search.get("local") or []
    if local_hits:
        result = {"status": "skipped", "reason": "local_hits_exist", "localHits": len(local_hits)}
        _save_task_backfill_record(plan_id, query, result)
        return result

    keywords = extract_crawl_keywords(query)
    if not keywords:
        result = {"status": "skipped", "reason": "no_keywords"}
        _save_task_backfill_record(plan_id, query, result)
        return result

    keyword = keywords[0]
    if _was_recently_backfilled(keyword):
        result = {"status": "skipped", "reason": "recently_backfilled", "keyword": keyword}
        _save_task_backfill_record(plan_id, query, result)
        return result

    logger.info("Task backfill: local=0, crawling NPC keyword=%s plan_id=%s", keyword, plan_id)
    service = LegalCrawlService(seen_bbbs=get_seen_bbbs())
    crawl_result = service.run(keywords=[keyword])
    rows = crawl_result.get("results") or []
    row = rows[0] if rows else {}
    for bbbs in crawl_result.get("seen_bbbs") or []:
        remember_bbbs(str(bbbs))
    _remember_recent_keyword(keyword)

    result = {
        "status": row.get("status") or ("failed" if crawl_result.get("errors") else "unknown"),
        "keyword": keyword,
        "name": row.get("name"),
        "bbbs": row.get("bbbs"),
        "chunks": row.get("chunks"),
        "vectors": row.get("vectors"),
        "errors": crawl_result.get("errors") or [],
    }
    _save_task_backfill_record(plan_id, query, result)
    logger.info("Task backfill finished: %s", result)
    return result
