#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.cosight.agent.actor.instance.specialist_actor_instance import (
    SPECIALIST_DEFINITIONS,
    create_specialist_actor_instance,
    infer_agent_id,
    resolve_step_agent_id,
)


EXPECTED_TOOLS = {
    "evidence": {"mark_step", "file_read", "file_find_in_content", "extract_document_content", "ask_question_about_image", "file_saver"},
    "issue_spotter": {"mark_step", "file_read", "file_find_in_content", "file_saver"},
    "research": {"mark_step", "legal_search", "search_google", "tavily_search", "search_wiki", "fetch_website_content", "file_read", "file_saver"},
    "clause_risk": {"mark_step", "file_read", "file_find_in_content", "contract_compare", "file_saver"},
    "calculation": {"mark_step", "file_read", "execute_code", "file_saver"},
    "drafting": {"mark_step", "file_read", "file_saver", "file_str_replace", "create_html_report"},
    "verification": {"mark_step", "file_read", "file_find_in_content", "execute_code", "file_saver"},
}


class FakePlan:
    steps = ["法规研究", "任意步骤"]
    step_agent_ids = {1: "calculation"}


def main() -> int:
    assert set(SPECIALIST_DEFINITIONS) == set(EXPECTED_TOOLS)
    for agent_id, expected in EXPECTED_TOOLS.items():
        instance = create_specialist_actor_instance(agent_id, "validation", str(ROOT / "work_space"))
        actual = {skill.skill_name for skill in instance.template.skills}
        assert actual == expected, f"{agent_id}: expected={sorted(expected)}, actual={sorted(actual)}"
        assert instance.template.business_type["agent_id"] == agent_id
        assert instance.display_name_zh == SPECIALIST_DEFINITIONS[agent_id]["name_zh"]

    inference_cases = {
        "证据质检与材料解析": "evidence",
        "识别法律关系与争议焦点": "issue_spotter",
        "检索违约责任法规依据": "research",
        "合同条款风险与版本比对": "clause_risk",
        "计算逾期利息与诉讼时效": "calculation",
        "生成合同审查报告": "drafting",
        "交叉审查与最终校验": "verification",
    }
    for title, expected in inference_cases.items():
        assert infer_agent_id(title) == expected, (title, infer_agent_id(title), expected)

    plan = FakePlan()
    assert resolve_step_agent_id(plan, 0) == "research"
    assert resolve_step_agent_id(plan, 1) == "calculation"

    all_tools = set().union(*EXPECTED_TOOLS.values())
    assert "legal_search" not in EXPECTED_TOOLS["evidence"]
    assert "execute_code" not in EXPECTED_TOOLS["research"]
    assert "extract_document_content" not in EXPECTED_TOOLS["drafting"]
    print("Phase-2 specialist templates and dispatcher: PASS")
    print(f"Agents: planner + {len(EXPECTED_TOOLS)} specialist workers")
    print(f"Distinct exposed tools: {len(all_tools)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
