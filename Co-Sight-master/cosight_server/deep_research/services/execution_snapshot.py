# Copyright 2025 ZTE Corporation.
# Parse Co-Sight replay.json into exportable execution snapshots.

from __future__ import annotations

import json
import os
from collections import Counter
from typing import Dict, List, Optional, Tuple


def _parse_content(raw) -> Dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def _normalize_status(status: str) -> str:
    mapping = {
        "completed": "已完成",
        "in_progress": "执行中",
        "not_started": "待开始",
        "blocked": "阻塞",
        "failed": "失败",
    }
    return mapping.get(status, status or "未知")


def _resolve_replay_path(workspace_root: str, workspace_path: str) -> str:
    folder_name = workspace_path.replace("\\", "/").strip("/").split("/")[-1]
    candidates = [
        os.path.join(workspace_root, "replay_history", folder_name, "replay.json"),
        os.path.join(workspace_root, folder_name, "replay.json"),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    raise FileNotFoundError(f"replay.json not found for workspace: {workspace_path}")


def parse_replay_events(events: List[Dict]) -> Dict:
    latest_step_content: Dict = {}
    tool_events: List[Dict] = []
    human_query = ""

    for event in events:
        content_type = event.get("contentType") or event.get("content_type")
        content = _parse_content(event.get("content"))

        if content_type == "lui-message-manus-step":
            latest_step_content = content
        elif content_type == "lui-message-tool-event":
            tool_events.append(content)
        elif content_type in ("lui-message-human", "human"):
            query = content.get("value") or content.get("text") or content.get("title")
            if isinstance(query, str) and query.strip():
                human_query = query.strip()

    title = str(latest_step_content.get("title") or "Co-Sight 法律任务")
    raw_steps = latest_step_content.get("steps") or []
    step_statuses = latest_step_content.get("step_statuses") or {}
    step_notes = latest_step_content.get("step_notes") or {}
    step_details = latest_step_content.get("step_details") or {}
    dependencies = latest_step_content.get("dependencies") or {}
    step_agent_ids = latest_step_content.get("step_agent_ids") or {}
    step_parallel_groups = latest_step_content.get("step_parallel_groups") or {}
    step_conditions = latest_step_content.get("step_conditions") or {}
    step_expected_artifacts = latest_step_content.get("step_expected_artifacts") or {}
    progress = latest_step_content.get("progress") or {}
    result_text = str(latest_step_content.get("result") or "").strip()
    status_text = str(latest_step_content.get("statusText") or "").strip()

    steps: List[Dict] = []
    for index, step_title in enumerate(raw_steps):
        status_key = step_statuses.get(step_title, "not_started")
        note = str(step_notes.get(step_title) or step_details.get(step_title) or "").strip()
        steps.append({
            "index": index,
            "title": step_title,
            "status": status_key,
            "statusLabel": _normalize_status(status_key),
            "note": note,
            "agentId": str(step_agent_ids.get(str(index), step_agent_ids.get(index, ""))),
            "parallelGroup": str(step_parallel_groups.get(str(index), step_parallel_groups.get(index, ""))),
            "condition": str(step_conditions.get(str(index), step_conditions.get(index, ""))),
            "expectedArtifact": str(step_expected_artifacts.get(str(index), step_expected_artifacts.get(index, ""))),
        })

    tools: List[Dict] = []
    tool_names: List[str] = []
    for tool_event in tool_events:
        event_type = str(tool_event.get("event_type") or "tool_complete")
        status = {
            "tool_start": "running",
            "tool_complete": "completed",
            "tool_error": "failed",
        }.get(event_type, "completed")
        tool_name = str(tool_event.get("tool_name") or tool_event.get("tool_name_zh") or "unknown")
        tool_names.append(tool_name)
        processed = tool_event.get("processed_result") or {}
        summary = ""
        if isinstance(processed, dict):
            summary = str(processed.get("summary") or processed.get("operation") or "")
        if not summary and status == "failed":
            summary = str(tool_event.get("error") or "工具调用失败")
        if not summary and status == "running":
            summary = "正在执行该处理动作"
        tools.append({
            "toolName": tool_name,
            "stepIndex": tool_event.get("step_index"),
            "summary": summary,
            "status": status,
            "timestamp": tool_event.get("timestamp"),
            "duration": tool_event.get("duration"),
            "capabilityId": tool_event.get("capability_id"),
            "resultType": tool_event.get("result_type"),
            "runtimeAgentId": tool_event.get("agent_id"),
            "resultData": tool_event.get("result_data"),
            "sources": tool_event.get("sources") or [],
            "artifacts": tool_event.get("artifacts") or [],
            "metrics": tool_event.get("metrics") or {},
        })

    tool_counter = Counter(tool_names)
    dag_hops = len(steps) if steps else max(len(dependencies) + 1, 1)

    return {
        "title": title,
        "taskQuery": human_query,
        "steps": steps,
        "dependencies": dependencies,
        "stepAgentIds": step_agent_ids,
        "stepParallelGroups": step_parallel_groups,
        "stepConditions": step_conditions,
        "stepExpectedArtifacts": step_expected_artifacts,
        "selectedAgents": latest_step_content.get("selected_agents") or [],
        "skippedAgents": latest_step_content.get("skipped_agents") or [],
        "scenario": latest_step_content.get("scenario") or "",
        "targetOutput": latest_step_content.get("target_output") or "",
        "riskLevel": latest_step_content.get("risk_level") or "medium",
        "progress": progress,
        "result": result_text,
        "statusText": status_text,
        "tools": tools,
        "toolSummary": [{"name": name, "count": count} for name, count in tool_counter.most_common()],
        "stats": {
            "stepCount": len(steps),
            "toolCallCount": len(tools),
            "dagHopCount": dag_hops,
            "completedSteps": progress.get("completed", 0) if isinstance(progress, dict) else 0,
            "messageCount": len(events),
        },
        "source": "replay",
    }


def load_execution_snapshot(workspace_root: str, workspace_path: str) -> Dict:
    replay_path = _resolve_replay_path(workspace_root, workspace_path)
    events: List[Dict] = []
    with open(replay_path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except Exception:
                continue

    snapshot = parse_replay_events(events)
    snapshot["workspacePath"] = workspace_path
    snapshot["replayFile"] = replay_path
    return snapshot


def build_export_sections_from_snapshot(
    snapshot: Dict,
    template_id: str = "task_summary_report",
) -> Tuple[str, List[Dict[str, str]]]:
    title = snapshot.get("title") or "Co-Sight 执行报告"
    template_titles = {
        "contract_review_report": f"{title} · 合同审查报告",
        "lawyer_letter_draft": f"{title} · 律师函初稿",
        "legal_opinion_summary": f"{title} · 法律意见摘要",
        "evidence_checklist": f"{title} · 证据清单",
        "task_summary_report": f"{title} · 任务总结报告",
    }
    export_title = template_titles.get(template_id, title)

    stats = snapshot.get("stats") or {}
    progress = snapshot.get("progress") or {}
    task_query = snapshot.get("taskQuery") or "（任务描述见工作台提交内容）"
    result_text = snapshot.get("result") or "（执行尚未产出最终结论文本，以下为过程阶段与工具证据。）"

    overview_lines = [
        f"任务标题：{title}",
        f"任务描述：{task_query}",
        f"执行状态：{snapshot.get('statusText') or '进行中/已记录'}",
        f"阶段进度：{progress.get('completed', 0)}/{progress.get('total', len(snapshot.get('steps', [])))}",
        f"DAG 跳数：{stats.get('dagHopCount', 0)}",
        f"工具调用：{stats.get('toolCallCount', 0)} 次",
    ]

    step_lines = []
    for step in snapshot.get("steps", []):
        line = f"{step.get('index', 0) + 1}. [{step.get('statusLabel', '未知')}] {step.get('title', '')}"
        note = step.get("note")
        if note:
            line += f"\n   备注：{note}"
        step_lines.append(line)
    if not step_lines:
        step_lines.append("暂无阶段记录。")

    dependency_lines = []
    dependencies = snapshot.get("dependencies") or {}
    if isinstance(dependencies, dict) and dependencies:
        for target, sources in dependencies.items():
            dependency_lines.append(f"节点 {target} 依赖：{sources}")
    else:
        dependency_lines.append("依赖关系由 Co-Sight Plan 动态生成。")

    tool_lines = []
    for item in snapshot.get("toolSummary", []):
        tool_lines.append(f"- {item.get('name')} × {item.get('count')}")
    for tool in snapshot.get("tools", [])[:12]:
        summary = tool.get("summary")
        if summary:
            tool_lines.append(f"  · {tool.get('toolName')}: {summary}")
    if not tool_lines:
        tool_lines.append("暂无工具调用记录。")

    provenance_lines = [
        f"数据来源：Co-Sight replay.json",
        f"工作区：{snapshot.get('workspacePath') or '当前会话'}",
        f"事件条数：{stats.get('messageCount', 0)}",
        f"导出策略：真实执行结果优先（参考 AgentScope / AgentReplay 溯源思路）",
    ]
    if snapshot.get("replayFile"):
        provenance_lines.append(f"回放文件：{snapshot.get('replayFile')}")

    sections = [
        {"title": "一、任务与执行概览", "body": "\n".join(overview_lines)},
        {"title": "二、Co-Sight DAG 阶段推进", "body": "\n".join(step_lines)},
        {"title": "三、DAG 依赖关系", "body": "\n".join(dependency_lines)},
        {"title": "四、工具链调用证据", "body": "\n".join(tool_lines)},
        {"title": "五、阶段结论与输出", "body": result_text},
        {
            "title": "六、自动质量校验",
            "body": "本文件基于 Co-Sight 真实执行记录生成，并由核验智能体对事实、依据、引用和输出一致性进行自动校验。",
        },
        {"title": "附录 · 执行溯源", "body": "\n".join(provenance_lines)},
    ]
    return export_title, sections
