#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.cosight.task.todolist import Plan
from cosight_server.deep_research.services.execution_finalizer import build_final_report


def main() -> int:
    plan = Plan()
    plan.update(
        title="合同违约责任分析",
        steps=["材料核验", "法规研究", "质量校验"],
        dependencies={1: [0], 2: [1]},
        agent_ids=["evidence", "research", "verification"],
        expected_artifacts=["材料报告", "法条清单", "最终报告"],
        selected_agents=["evidence", "research", "verification"],
        skipped_agents=[{"agentId": "calculation", "reason": "任务不涉及金额计算"}],
        scenario="合同分析",
        target_output="列出三条违约责任要点",
        risk_level="medium",
    )
    plan.mark_step(0, "completed")
    plan.step_notes[plan.steps[0]] = "已读取合同并定位违约条款。"
    plan.add_tool_call(0, "file_read", '{"file":"contract.txt"}')
    plan.mark_step(1, "completed")
    plan.step_notes[plan.steps[1]] = "依据《民法典》第五百七十七条形成法条结论。"
    plan.add_tool_call(1, "legal_search", '{"query":"违约责任"}')
    plan.settle_unfinished_steps("verification timeout")

    assert plan.get_ready_steps() == [], "blocked dependency must not release downstream steps"
    report, verification = build_final_report(plan, "分析合同违约责任")
    assert report and "自动质量校验" in report and "法律事项" not in report
    assert verification["allStepsTerminal"] is True
    assert verification["hasTraceableSources"] is True
    assert verification["level"] == "passed_with_warnings"
    plan.lock_planning()
    try:
        plan.update(title="late planner overwrite")
        raise AssertionError("locked plan accepted a late planner update")
    except RuntimeError:
        pass

    websocket_source = (ROOT / "cosight_server/deep_research/routers/websocket_manager.py").read_text(encoding="utf-8")
    cosight_source = (ROOT / "CoSight.py").read_text(encoding="utf-8")
    assert "completed + blocked >= total" in websocket_source
    assert "has_result" in websocket_source
    assert "finished_with_warnings" in websocket_source
    assert "MAX_TASK_EXECUTION_SECONDS" in cosight_source
    assert "MAX_PLANNER_SECONDS" in cosight_source
    assert "_create_fallback_plan" in cosight_source
    assert "settle_unfinished_steps" in cosight_source
    print("Phase-5 deterministic finalization and automatic verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
