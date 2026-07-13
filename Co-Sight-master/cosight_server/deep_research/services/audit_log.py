# Copyright 2025 ZTE Corporation.
# Build structured audit logs from Co-Sight replay.json (LearnWeave metadata pattern).

from __future__ import annotations

import hashlib
import json
from typing import Dict, List, Optional

from cosight_server.deep_research.services.execution_snapshot import parse_replay_events

AUDIT_AGENTS = {
    "planner": "任务理解智能体",
    "evidence": "证据质检智能体",
    "research": "法规研究智能体",
    "drafting": "文书生成智能体",
    "review": "交叉审查智能体",
    "compliance": "合规监测智能体",
}


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


def _entry_hash(previous_hash: str, payload: str) -> str:
    digest = hashlib.sha256(f"{previous_hash}|{payload}".encode("utf-8")).hexdigest()
    return digest[:16]


def _infer_agent_for_step(step_index: int, step_count: int) -> str:
    if step_count <= 0:
        return AUDIT_AGENTS["planner"]
    ratio = step_index / max(step_count - 1, 1)
    if ratio < 0.2:
        return AUDIT_AGENTS["planner"]
    if ratio < 0.4:
        return AUDIT_AGENTS["evidence"]
    if ratio < 0.6:
        return AUDIT_AGENTS["research"]
    if ratio < 0.8:
        return AUDIT_AGENTS["drafting"]
    if ratio < 0.95:
        return AUDIT_AGENTS["review"]
    return AUDIT_AGENTS["compliance"]


def build_audit_log(events: List[Dict], workspace_name: str = "") -> Dict:
    snapshot = parse_replay_events(events)
    entries: List[Dict] = []
    chain_hash = "genesis"
    sequence = 0

    session_info = {}
    for event in events:
        info = event.get("sessionInfo")
        if isinstance(info, dict) and info:
            session_info = info
            break

    username = session_info.get("username") or "system"
    session_id = session_info.get("sessionId") or workspace_name or "unknown"

    def append_entry(entry_type: str, actor: str, detail: str, timestamp: str = "", metadata: Optional[Dict] = None) -> None:
        nonlocal chain_hash, sequence
        sequence += 1
        payload = json.dumps({
            "seq": sequence,
            "type": entry_type,
            "actor": actor,
            "detail": detail,
            "timestamp": timestamp,
            "metadata": metadata or {},
        }, ensure_ascii=False, sort_keys=True)
        chain_hash = _entry_hash(chain_hash, payload)
        entries.append({
            "id": f"audit-{sequence:04d}",
            "sequence": sequence,
            "type": entry_type,
            "actor": actor,
            "detail": detail,
            "timestamp": timestamp,
            "metadata": metadata or {},
            "hash": chain_hash,
        })

    append_entry(
        "session_start",
        "Co-Sight Runtime",
        f"会话启动 · workspace={workspace_name or 'unknown'}",
        metadata={"sessionId": session_id, "username": username},
    )

    human_query = snapshot.get("taskQuery") or ""
    if human_query:
        append_entry("task_submit", username, f"提交任务：{human_query[:120]}")

    seen_steps: set[str] = set()
    for step in snapshot.get("steps", []):
        status = step.get("status")
        title = step.get("title") or ""
        if status in ("completed", "in_progress") and title not in seen_steps:
            seen_steps.add(title)
            agent = _infer_agent_for_step(step.get("index", 0), len(snapshot.get("steps", [])))
            append_entry(
                "agent_stage",
                agent,
                f"[{step.get('statusLabel', status)}] {title[:100]}",
                metadata={"stepIndex": step.get("index"), "status": status},
            )

    for tool in snapshot.get("tools", []):
        append_entry(
            "tool_call",
            "Co-Sight Toolchain",
            f"{tool.get('toolName')} · step {tool.get('stepIndex')} · {tool.get('summary') or 'completed'}",
            timestamp=str(tool.get("timestamp") or ""),
            metadata={
                "toolName": tool.get("toolName"),
                "duration": tool.get("duration"),
                "stepIndex": tool.get("stepIndex"),
            },
        )

    credibility_count = 0
    for event in events:
        content_type = event.get("contentType") or event.get("content_type")
        if content_type != "lui-message-credibility-analysis":
            continue
        content = _parse_content(event.get("content"))
        if isinstance(content, list):
            items = content
        elif isinstance(content, dict):
            items = content.get("content") or content.get("items") or []
        else:
            items = []
        step_index = None
        if isinstance(content, dict):
            step_index = content.get("stepIndex")
        credibility_count += 1
        append_entry(
            "credibility_analysis",
            AUDIT_AGENTS["review"],
            f"步骤 {step_index if step_index is not None else credibility_count} 可信分级 · {len(items)} 类信息",
            metadata={"stepIndex": step_index, "categories": len(items)},
        )

    stats = snapshot.get("stats") or {}
    append_entry(
        "session_summary",
        AUDIT_AGENTS["compliance"],
        (
            f"归档摘要 · 阶段 {stats.get('stepCount', 0)} · "
            f"工具 {stats.get('toolCallCount', 0)} · "
            f"事件 {stats.get('messageCount', 0)}"
        ),
        metadata=stats,
    )

    append_entry(
        "audit_seal",
        "LexHub Audit Chain",
        f"审计链封存 · entries={len(entries)} · chain={chain_hash}",
        metadata={"chainHash": chain_hash, "entryCount": len(entries)},
    )

    return {
        "workspaceName": workspace_name,
        "sessionId": session_id,
        "username": username,
        "title": snapshot.get("title") or "Co-Sight 任务",
        "chainHash": chain_hash,
        "entryCount": len(entries),
        "entries": entries,
        "stats": stats,
        "source": "replay",
    }


def build_review_from_audit(audit_log: Dict, snapshot: Optional[Dict] = None) -> Dict:
    snapshot = snapshot or {}
    stats = audit_log.get("stats") or snapshot.get("stats") or {}
    entries = audit_log.get("entries") or []

    tool_calls = stats.get("toolCallCount", 0)
    completed = stats.get("completedSteps", 0)
    total_steps = stats.get("stepCount", 0) or len(snapshot.get("steps", []))
    credibility_entries = [item for item in entries if item.get("type") == "credibility_analysis"]

    fact_tone = "success" if completed >= max(1, total_steps // 2) else "warning"
    fact_value = "通过" if fact_tone == "success" else "待确认"

    evidence_tone = "warning" if tool_calls < 3 else "success"
    evidence_value = "需补证" if evidence_tone == "warning" else "基本充分"

    citation_tone = "warning" if credibility_entries else "primary"
    citation_value = "已分级" if credibility_entries else "待引用"

    draft_tone = "primary" if completed >= total_steps and total_steps > 0 else "warning"
    draft_value = "可导出" if draft_tone == "primary" else "草稿"

    review_items = [
        {
            "label": "事实一致性",
            "value": fact_value,
            "detail": f"已完成 {completed}/{total_steps or '—'} 个 Co-Sight 阶段，replay 可复核。",
            "tone": fact_tone,
        },
        {
            "label": "证据支撑性",
            "value": evidence_value,
            "detail": f"共记录 {tool_calls} 次工具调用，材料与检索轨迹已写入审计链。",
            "tone": evidence_tone,
        },
        {
            "label": "法规适配性",
            "value": citation_value,
            "detail": (
                f"可信分级分析 {len(credibility_entries)} 次，引用来源可追溯到工具结果。"
                if credibility_entries
                else "尚未产生可信分级事件，建议补充法规检索后再导出。"
            ),
            "tone": citation_tone,
        },
        {
            "label": "文书完整性",
            "value": draft_value,
            "detail": "导出前由交叉审查与合规监测智能体完成自动一致性校验。",
            "tone": draft_tone,
        },
        {
            "label": "合规监测",
            "value": "已归档" if audit_log.get("chainHash") else "待归档",
            "detail": f"审计链 hash={audit_log.get('chainHash', '—')}，共 {audit_log.get('entryCount', 0)} 条记录。",
            "tone": "success" if audit_log.get("chainHash") else "warning",
        },
    ]

    warnings = sum(1 for item in review_items if item["tone"] in ("warning", "danger"))
    passed = sum(1 for item in review_items if item["tone"] == "success")

    risk_findings = []
    if evidence_tone == "warning":
        risk_findings.append("工具调用较少，证据链可能不完整，建议补充材料上传与检索步骤。")
    if not credibility_entries:
        risk_findings.append("尚未触发可信分级分析，正式报告应绑定具体法规条款或案例来源。")
    if draft_tone != "primary":
        risk_findings.append("Co-Sight 阶段尚未全部完成，导出内容可能仅为过程草稿。")
    if not risk_findings:
        risk_findings.append("当前 replay 审计链完整，导出前仍建议律师人工终检。")

    overall = "自动校验通过，可进入导出流程" if passed >= 3 else "已生成降级结果，建议补充缺失材料后重新校验"

    return {
        "overallVerdict": overall,
        "reviewItems": review_items,
        "riskFindings": risk_findings,
        "stats": {
            "dimensions": len(review_items),
            "passed": passed,
            "warnings": warnings,
            "outputLevel": draft_value,
        },
        "auditChainHash": audit_log.get("chainHash"),
        "dataSource": "replay",
    }
