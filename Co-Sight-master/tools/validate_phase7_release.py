#!/usr/bin/env python3
"""Offline release-readiness audit for the completed LexHub staged overhaul."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _validate_registry() -> None:
    registry = _load_json(ROOT / "config/agent-registry.json")
    agents = registry["agents"]
    assert len(agents) == 8, f"expected planner + 7 specialists, got {len(agents)}"
    ids = [agent["id"] for agent in agents]
    assert len(ids) == len(set(ids)) and ids[0] == "planner"

    catalog_ids = {item["id"] for item in registry["toolCatalog"]}
    registered = {tool for agent in agents for tool in agent.get("registeredTools", [])}
    missing = registered - catalog_ids
    assert not missing, f"registered tools missing from catalog: {sorted(missing)}"


def _validate_acceptance_cases() -> None:
    payload = _load_json(ROOT / "config/acceptance-cases.json")
    cases = payload["cases"]
    assert len(cases) >= 3
    assert {case["scenario"] for case in cases} >= {
        "contract_review", "dispute_resolution", "legal_research"
    }
    for case in cases:
        expected = case["expected"]
        assert "planner" in expected["requiredAgents"] and "verification" in expected["requiredAgents"]
        fixture = case.get("fixture")
        if fixture:
            assert (ROOT / fixture).is_file(), f"missing fixture: {fixture}"


def _validate_configuration_and_docs() -> None:
    template = (ROOT / ".env_template").read_text(encoding="utf-8")
    for key in (
        "API_KEY", "BAIDU_OCR_API_KEY", "BAIDU_OCR_SECRET_KEY",
        "DELILEGAL_APPID", "DELILEGAL_SECRET", "TAVILY_API_KEY",
    ):
        matching = [line for line in template.splitlines() if line.startswith(f"{key}=")]
        assert matching and matching[0] == f"{key}=", f"secret placeholder must be empty: {key}"

    api_docs = (ROOT / "docs/API-CONFIGURATION.md").read_text(encoding="utf-8")
    assert "SEARCH_ENGINE_ID" in api_docs and "GOOGLE_CSE_ID" not in api_docs
    assert "OCR 控制台" in api_docs and "比赛演示配置优先级" in api_docs
    assert (ROOT / "docs/DEMO-RUNBOOK.md").is_file()
    assert (REPO_ROOT / "Co-Sight-master-raw" / "Co-Sight-master").is_dir()


def _validate_frontend_delivery() -> None:
    app = (ROOT / "cosight_frontend/src/App.tsx").read_text(encoding="utf-8")
    assert "lazy(() => import(" in app and "<Suspense" in app
    assert "route-loading" in app
    launcher = (ROOT / "start_lexhub.py").read_text(encoding="utf-8")
    assert "_wait_for_service" in launcher and "--stop" in launcher
    assert (ROOT / "start-cosight.bat").is_file() and (ROOT / "stop-cosight.bat").is_file()
    assert b"\r\n" in (ROOT / "start-cosight.bat").read_bytes(), "Windows launcher must use CRLF"
    outer_launcher = REPO_ROOT / "start-lexhub.bat"
    assert outer_launcher.is_file() and b"\r\n" in outer_launcher.read_bytes()
    assert "Co-Sight-master\\start_lexhub.py" in outer_launcher.read_text(encoding="utf-8")


def _run_phase_validators() -> None:
    for phase in range(1, 7):
        path = ROOT / "tools" / f"validate_phase{phase}_"  # prefix only
        matches = sorted(path.parent.glob(f"{path.name}*.py"))
        assert len(matches) == 1, f"expected one validator for phase {phase}"
        completed = subprocess.run(
            [sys.executable, str(matches[0])],
            cwd=ROOT,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=120,
        )
        if completed.returncode != 0:
            raise AssertionError(
                f"phase {phase} regression failed:\n{completed.stdout}\n{completed.stderr}"
            )
    empty_state = subprocess.run(
        [sys.executable, str(ROOT / "tools/validate_replay_empty_state.py")],
        cwd=ROOT,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
    )
    assert empty_state.returncode == 0, empty_state.stdout + empty_state.stderr


def main() -> int:
    _validate_registry()
    _validate_acceptance_cases()
    _validate_configuration_and_docs()
    _validate_frontend_delivery()
    _run_phase_validators()
    print("Phase-7 offline release readiness (including Phase 1-6 regressions): PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
