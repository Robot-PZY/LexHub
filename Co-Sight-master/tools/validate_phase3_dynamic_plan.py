#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.cosight.agent.actor.instance.specialist_actor_instance import resolve_step_agent_id
from app.cosight.agent.planner.instance.planner_agent_skill import create_plan_skill
from app.cosight.task.todolist import Plan
from app.cosight.tool.plan_toolkit import PlanToolkit


def main() -> int:
    plan = Plan(work_space_path=str(ROOT / "work_space"))
    toolkit = PlanToolkit(plan)
    steps = ["材料证据", "法规研究", "法律争点", "条款风险", "文书生成", "质量校验"]
    agent_ids = ["evidence", "research", "issue_spotter", "clause_risk", "drafting", "verification"]
    toolkit.create_plan(
        title="服务合同审查",
        steps=steps,
        dependencies={2: [0, 1], 3: [2], 4: [1, 3], 5: [4]},
        agent_ids=agent_ids,
        parallel_groups={0: "assessment", 1: "assessment"},
        conditions={3: "scenario == contract_review"},
        expected_artifacts=["evidence_report", "legal_research", "legal_issues", "clause_risk_report", "draft_document", "verification_decision"],
        selected_agents=agent_ids,
        skipped_agents=[{"agentId": "calculation", "reason": "不涉及期限、利息或金额计算"}],
        scenario="contract_review",
        target_output="contract_review_report",
        risk_level="high",
    )
    assert plan.get_ready_steps() == [0, 1]
    assert plan.step_agent_ids[3] == "clause_risk"
    assert plan.step_parallel_groups == {0: "assessment", 1: "assessment"}
    assert plan.step_expected_artifacts[5] == "verification_decision"
    assert plan.selected_agents == agent_ids
    assert plan.skipped_agents[0]["agentId"] == "calculation"
    assert resolve_step_agent_id(plan, 3) == "clause_risk"
    assert "[agent: research]" in plan.format()

    simple = Plan(work_space_path=str(ROOT / "work_space"))
    PlanToolkit(simple).create_plan(
        title="简单法律咨询",
        steps=["识别法律争点", "法规研究", "质量校验"],
        dependencies={1: [0], 2: [1]},
        agent_ids=["issue_spotter", "research", "verification"],
        expected_artifacts=["legal_issues", "legal_research", "verification_decision"],
        selected_agents=["issue_spotter", "research", "verification"],
        skipped_agents=[
            {"agentId": "evidence", "reason": "没有上传材料"},
            {"agentId": "clause_risk", "reason": "不是合同场景"},
            {"agentId": "calculation", "reason": "不涉及计算"},
            {"agentId": "drafting", "reason": "不需要独立正式文书"},
        ],
        scenario="legal_research",
        target_output="direct_answer",
        risk_level="low",
    )
    assert len(simple.steps) == 3 and "evidence" not in simple.selected_agents

    inferred = Plan(work_space_path=str(ROOT / "work_space"))
    inferred.update(
        title="模型省略并行组",
        steps=["材料核验", "法规研究", "综合结论"],
        dependencies={2: [0, 1]},
        agent_ids=["evidence", "research", "verification"],
        parallel_groups={},
    )
    assert inferred.step_parallel_groups == {0: "auto-level-0", 1: "auto-level-0"}

    invalid_agent = Plan()
    try:
        invalid_agent.update("bad", ["x"], {}, agent_ids=["unknown"])
        raise AssertionError("unknown agent should fail")
    except ValueError as exc:
        assert "Unknown specialist" in str(exc)

    cyclic = Plan()
    try:
        cyclic.update("cycle", ["a", "b"], {0: [1], 1: [0]})
        raise AssertionError("cycle should fail")
    except ValueError as exc:
        assert "acyclic" in str(exc)

    schema = create_plan_skill()["function"].parameters
    required = set(schema["required"])
    assert {"agent_ids", "selected_agents", "skipped_agents", "expected_artifacts", "scenario", "target_output", "risk_level"}.issubset(required)
    print("Phase-3 dynamic execution plan: PASS")
    print("Parallel ready steps: evidence, research")
    print("Simple route workers: issue_spotter, research, verification")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
