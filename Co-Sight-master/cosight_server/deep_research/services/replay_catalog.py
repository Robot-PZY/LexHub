"""Fault-tolerant replay workspace catalog used by the replay API."""

from __future__ import annotations

from datetime import datetime
import json
import os
from typing import Any

from app.common.logger_util import logger


def _to_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _read_replay_summary(replay_file_path: str) -> dict[str, Any] | None:
    summary: dict[str, Any] = {
        "title": "未命名任务",
        "message_count": 0,
        "step_count": 0,
        "completed_steps": 0,
        "blocked_steps": 0,
        "tool_count": 0,
        "agent_ids": set(),
        "scenario": "",
        "has_result": False,
    }
    try:
        with open(replay_file_path, "r", encoding="utf-8") as handle:
            for raw_line in handle:
                summary["message_count"] += 1
                try:
                    event = json.loads(raw_line)
                except (TypeError, ValueError):
                    continue
                if not isinstance(event, dict):
                    continue
                content_type = event.get("contentType") or event.get("content_type")
                content = event.get("content", {})
                if isinstance(content, str):
                    try:
                        content = json.loads(content)
                    except (TypeError, ValueError):
                        content = {}
                if content_type == "lui-message-workspace-binding" and isinstance(content, dict):
                    summary["title"] = content.get("matterTitle") or summary["title"]
                elif content_type == "lui-message-manus-step" and isinstance(content, dict):
                    summary["title"] = content.get("title") or summary["title"]
                    steps = content.get("steps") or []
                    progress = content.get("progress") or {}
                    if not isinstance(steps, list):
                        steps = []
                    if not isinstance(progress, dict):
                        progress = {}
                    summary["step_count"] = len(steps)
                    summary["completed_steps"] = _to_int(progress.get("completed"))
                    summary["blocked_steps"] = _to_int(progress.get("blocked"))
                    summary["scenario"] = str(content.get("scenario") or summary["scenario"])
                    summary["has_result"] = bool(str(content.get("result") or "").strip())
                    agent_ids = content.get("step_agent_ids") or {}
                    if not isinstance(agent_ids, dict):
                        agent_ids = {}
                    summary["agent_ids"].update(
                        str(value)
                        for value in agent_ids.values()
                        if value
                    )
                elif content_type == "lui-message-tool-event":
                    summary["tool_count"] += 1
    except OSError as exc:
        logger.warning("读取 replay 文件失败，已忽略该记录: %s (%s)", replay_file_path, exc)
        return None
    return summary


def list_replay_workspaces(replay_base_path: str, workspace_path: str) -> list[dict[str, Any]]:
    """Return replay summaries; missing, empty, or partially unreadable stores are valid."""
    workspaces: list[dict[str, Any]] = []
    seen: set[str] = set()

    def collect(base_dir: str, is_legacy: bool) -> None:
        try:
            entries = sorted(os.scandir(base_dir), key=lambda entry: entry.name, reverse=True)
        except (FileNotFoundError, NotADirectoryError):
            return
        except OSError as exc:
            logger.warning("回放目录暂时不可读取，按空历史处理: %s (%s)", base_dir, exc)
            return

        for entry in entries:
            folder_name = entry.name
            if folder_name in seen or folder_name in {"replay_history", "plans"}:
                continue
            try:
                if not entry.is_dir():
                    continue
                replay_file_path = os.path.join(entry.path, "replay.json")
                if not os.path.isfile(replay_file_path):
                    continue
                summary = _read_replay_summary(replay_file_path)
                if summary is None:
                    continue
                mtime = os.path.getmtime(replay_file_path)
            except OSError as exc:
                logger.warning("读取回放目录项失败，已忽略: %s (%s)", entry.path, exc)
                continue

            has_result = bool(summary["has_result"])
            blocked_steps = int(summary["blocked_steps"])
            workspaces.append({
                "workspace_name": folder_name,
                "workspace_path": f"work_space/{folder_name}",
                "title": summary["title"],
                "created_time": datetime.fromtimestamp(mtime).isoformat(),
                "message_count": summary["message_count"],
                "step_count": summary["step_count"],
                "completed_steps": summary["completed_steps"],
                "blocked_steps": blocked_steps,
                "tool_count": summary["tool_count"],
                "agent_count": len(summary["agent_ids"]),
                "scenario": summary["scenario"],
                "has_result": has_result,
                "status": (
                    "completed_with_warnings"
                    if has_result and blocked_steps
                    else "completed"
                    if has_result
                    else "incomplete"
                ),
                "replay_file": (
                    f"replay_history/{folder_name}/replay.json"
                    if not is_legacy
                    else f"work_space/{folder_name}/replay.json"
                ),
            })
            seen.add(folder_name)

    collect(replay_base_path, is_legacy=False)
    collect(workspace_path, is_legacy=True)
    return sorted(workspaces, key=lambda item: item["created_time"], reverse=True)
