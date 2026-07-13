#!/usr/bin/env python3
from __future__ import annotations

import sys
import threading
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from cosight_server.deep_research.services.capabilities.executor import (
    get_capability_executor,
    normalize_legacy_tool_result,
)
from cosight_server.deep_research.services.capabilities.models import CapabilityInvocation
from cosight_server.deep_research.services.capabilities.registry import get_capability_registry


def main() -> int:
    registry = get_capability_registry()
    assert {item.id for item in registry.list()} == {"document_parse", "legal_search", "contract_compare"}
    try:
        import jsonschema
    except ImportError:
        jsonschema = None
    if jsonschema is not None:
        runtime_schema = json.loads((ROOT / "config" / "contracts" / "lexhub-runtime-contracts.schema.json").read_text(encoding="utf-8"))
        validator = jsonschema.Draft202012Validator(runtime_schema["$defs"]["capabilityDefinition"])
        for definition in registry.list():
            validator.validate(definition.model_dump())

    executor = get_capability_executor()
    denied = executor.invoke(CapabilityInvocation(agentId="research", capabilityId="contract_compare", input={"originalText": "A", "revisedText": "B"}))
    assert denied.status == "failed" and denied.error and denied.error["code"] == "AGENT_NOT_ALLOWED"

    compared = executor.invoke(CapabilityInvocation(
        agentId="clause_risk",
        capabilityId="contract_compare",
        input={"originalText": "Fee is 100.", "revisedText": "Fee is 120."},
    ))
    assert compared.status == "success"
    assert compared.resultType == "diff"
    assert compared.data["summary"]["modified"] == 1

    parsed = executor.invoke(CapabilityInvocation(
        agentId="evidence",
        capabilityId="document_parse",
        input={"filePath": str(ROOT / "fixtures" / "contracts" / "service-contract.txt")},
    ))
    assert parsed.status == "success"
    assert parsed.data["characterCount"] > 100
    assert parsed.sources and parsed.sources[0]["type"] == "file"

    original_handler = executor._handlers["legal_search"]
    executor._handlers["legal_search"] = lambda payload: {
        "query": payload["query"], "laws": [{"title": "Civil Code"}], "cases": [], "local": [], "templates": [], "sources": ["fixture"]
    }
    try:
        searched = executor.invoke(CapabilityInvocation(agentId="research", capabilityId="legal_search", input={"query": "breach"}))
    finally:
        executor._handlers["legal_search"] = original_handler
    assert searched.status == "success" and searched.resultType == "legal_citations"
    assert searched.sources == [{"type": "provider", "name": "fixture"}]

    legacy = normalize_legacy_tool_result("legal_search", '{"laws": []}', invocation_id="legacy-1", duration_ms=12)
    assert legacy and legacy["capabilityId"] == "legal_search" and legacy["metrics"]["durationMs"] == 12
    assert normalize_legacy_tool_result("unknown_tool", "ok", invocation_id="legacy-2") is None

    from app.cosight.agent.base.base_agent import BaseAgent
    from app.cosight.task.plan_report_manager import plan_report_event_manager

    agent = BaseAgent.__new__(BaseAgent)
    agent.plan_id = "phase1-test-plan"
    agent.plan = None
    agent.agent_id = "research"
    agent._tool_event_sequence = 0
    agent._tool_event_lock = threading.Lock()
    agent._reported_tool_errors = set()
    published = []
    original_publish = plan_report_event_manager.publish
    plan_report_event_manager.publish = lambda event, key, data: published.append((event, key, data))
    try:
        agent._push_tool_event("tool_error", "legal_search", "{}", step_index=2, error="budget exhausted")
        agent._push_tool_event("tool_error", "legal_search", "{}", step_index=2, error="budget exhausted")
    finally:
        plan_report_event_manager.publish = original_publish
    assert len(published) == 1
    event_payload = published[0][2]
    assert event_payload["capability_id"] == "legal_search"
    assert event_payload["capability_result"]["status"] == "failed"

    print("Phase-1 capability registry and executor: PASS")
    print("Capabilities: document_parse, legal_search, contract_compare")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
