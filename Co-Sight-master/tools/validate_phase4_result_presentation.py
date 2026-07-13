#!/usr/bin/env python3
"""Static contract check for the phase-4 structured execution presentation."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def require(path: str, needles: list[str]) -> None:
    content = (ROOT / path).read_text(encoding="utf-8")
    missing = [needle for needle in needles if needle not in content]
    if missing:
        raise AssertionError(f"{path} missing: {', '.join(missing)}")


def main() -> int:
    require("cosight_frontend/src/types/chat.ts", [
        "capabilityId?: string", "resultType?: string", "runtimeAgentId?: string",
        "sources?:", "artifacts?:", "metrics?:",
    ])
    require("cosight_frontend/src/lib/event-adapter.ts", [
        "capability_result", "capability_id", "agent_id", "artifacts", "sources", "metrics",
    ])
    require("cosight_frontend/src/lib/plan-graph.ts", [
        "resultData: tool.resultData", "runtimeAgentId: tool.runtimeAgentId",
        "expectedArtifact: node.expectedArtifact",
    ])
    require("cosight_frontend/src/components/workspace/StepToolDetailPanel.tsx", [
        "结构化结果", "依据来源", "生成产物", "预期产物", "并行组",
    ])
    require("cosight_server/deep_research/services/execution_snapshot.py", [
        '"capabilityId"', '"runtimeAgentId"', '"stepExpectedArtifacts"', '"selectedAgents"',
    ])
    print("Phase-4 structured result presentation: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
