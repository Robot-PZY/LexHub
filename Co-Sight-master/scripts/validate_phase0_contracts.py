#!/usr/bin/env python3
"""Validate frozen phase-0 contracts and acceptance cases."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    schema_path = ROOT / "config" / "contracts" / "lexhub-runtime-contracts.schema.json"
    cases_path = ROOT / "config" / "acceptance-cases.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    cases = json.loads(cases_path.read_text(encoding="utf-8"))

    required_defs = {
        "agentDefinition",
        "capabilityDefinition",
        "artifactEnvelope",
        "capabilityResult",
        "executionPlan",
        "eventEnvelope",
    }
    actual_defs = set(schema.get("$defs") or {})
    missing = required_defs - actual_defs
    if missing:
        raise AssertionError(f"Missing schema definitions: {sorted(missing)}")

    case_list = cases.get("cases") or []
    if len(case_list) != 3:
        raise AssertionError(f"Expected 3 acceptance cases, got {len(case_list)}")
    ids = [item.get("id") for item in case_list]
    if len(ids) != len(set(ids)):
        raise AssertionError("Acceptance case ids must be unique")
    for item in case_list:
        expected = item.get("expected") or {}
        if len(expected.get("requiredAgents") or []) < 2:
            raise AssertionError(f"{item.get('id')}: at least two agents required")
        if len(expected.get("requiredCapabilities") or []) < 1:
            raise AssertionError(f"{item.get('id')}: at least one capability required")
        if int(expected.get("minimumDagDepth") or 0) < 3:
            raise AssertionError(f"{item.get('id')}: DAG depth must be at least 3")

    try:
        import jsonschema
    except ImportError:
        jsonschema = None
    if jsonschema is not None:
        jsonschema.Draft202012Validator.check_schema(schema)

    print("Phase-0 runtime contracts: PASS")
    print(f"Schema definitions: {len(actual_defs)}")
    print(f"Acceptance cases: {', '.join(ids)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
