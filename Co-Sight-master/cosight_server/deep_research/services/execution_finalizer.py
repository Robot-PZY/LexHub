from __future__ import annotations

import re
from typing import Any


def _compact(text: Any, limit: int = 1800) -> str:
    value = re.sub(r"\n{3,}", "\n\n", str(text or "").strip())
    return value if len(value) <= limit else value[:limit].rstrip() + "…"


def build_automatic_verification(plan) -> dict[str, Any]:
    statuses = list(plan.step_statuses.values())
    records = [item for group in plan.step_tool_calls.values() if isinstance(group, list) for item in group if isinstance(item, dict)]
    tool_names = {str(item.get("tool_name") or "") for item in records}
    notes = "\n".join(str(value or "") for value in plan.step_notes.values())
    checks = {
        "allStepsTerminal": all(status in {"completed", "blocked"} for status in statuses),
        "hasPhaseConclusions": any(str(value or "").strip() for value in plan.step_notes.values()),
        "hasTraceableSources": bool(tool_names & {"legal_search", "search_google", "search_wiki", "tavily_search"}) or bool(re.search(r"https?://|第[一二三四五六七八九十百千万\d]+条", notes)),
        "hasArtifacts": bool(tool_names & {"file_saver", "create_html_report", "contract_compare"}) or bool(re.search(r"\.(md|docx|pdf|html)\b", notes, re.I)),
        "hasBlockedSteps": "blocked" in statuses,
    }
    passed = sum(bool(checks[key]) for key in ("allStepsTerminal", "hasPhaseConclusions", "hasTraceableSources", "hasArtifacts"))
    checks["score"] = round(passed / 4 * 100)
    checks["level"] = "passed" if checks["score"] >= 75 and not checks["hasBlockedSteps"] else "passed_with_warnings"
    return checks


def build_final_report(plan, question: str) -> tuple[str, dict[str, Any]]:
    verification = build_automatic_verification(plan)
    progress = plan.get_progress()
    lines = [f"# {plan.title or '法律事项分析结果'}", "", "## 任务目标", _compact(plan.target_output or question, 900), "", "## 智能体执行结论"]
    for index, step in enumerate(plan.steps):
        note = _compact(plan.step_notes.get(step)) or "本阶段未形成独立文字结论，详见工具调用记录。"
        lines.extend([f"### {index + 1}. {step}", f"- 智能体：`{plan.step_agent_ids.get(index, 'specialist')}`", f"- 状态：{plan.step_statuses.get(step, 'not_started')}", "", note, ""])
    level = "校验通过" if verification["level"] == "passed" else "校验通过（存在降级项）"
    lines.extend(["## 自动质量校验", f"- 结论：**{level}**", f"- 完整度评分：**{verification['score']} / 100**", f"- 阶段终态：{progress['completed']} 个完成，{progress['blocked']} 个降级/阻塞", f"- 可追溯依据：{'已记录' if verification['hasTraceableSources'] else '未充分提取'}", f"- 交付产物：{'已记录' if verification['hasArtifacts'] else '以当前报告为主'}", "", "## 最终说明", "以上结果由 Planner 动态编排专业智能体完成，并基于阶段结论、工具调用记录和来源信息自动汇总。"])
    return "\n".join(lines).strip(), verification
