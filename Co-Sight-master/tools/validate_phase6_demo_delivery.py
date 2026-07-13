#!/usr/bin/env python3
"""Validate Phase 6 replay, deterministic export, and demo-facing UX contracts."""

from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from cosight_server.deep_research.services.document_export import build_export_file
from cosight_server.deep_research.services.execution_snapshot import load_execution_snapshot


def _validate_exports() -> None:
    sections = [
        {"title": "\u4e00\u3001\u4efb\u52a1\u7ed3\u8bba", "body": "\u5df2\u5b8c\u6210\u5408\u540c\u98ce\u9669\u8bc6\u522b\u4e0e\u81ea\u52a8\u8d28\u91cf\u6821\u9a8c\u3002"},
        {"title": "\u4e8c\u3001\u5de5\u5177\u8bc1\u636e", "body": "OCR -> \u6761\u6b3e\u89e3\u6790 -> \u6cd5\u89c4\u68c0\u7d22 -> \u7ed3\u679c\u6838\u9a8c"},
    ]
    docx, docx_name, docx_type = build_export_file(
        "task_summary_report", "docx", title="\u5f8b\u67a2\u6f14\u793a\u4ea4\u4ed8\u62a5\u544a", sections=sections
    )
    pdf, pdf_name, pdf_type = build_export_file(
        "task_summary_report", "pdf", title="\u5f8b\u67a2\u6f14\u793a\u4ea4\u4ed8\u62a5\u544a", sections=sections
    )
    assert docx.startswith(b"PK") and len(docx) > 10_000
    assert pdf.startswith(b"%PDF") and len(pdf) > 1_000
    assert docx_name.endswith(".docx") and "\u5f8b\u67a2" in docx_name
    assert pdf_name.endswith(".pdf") and "\u5f8b\u67a2" in pdf_name
    assert "openxmlformats" in docx_type and pdf_type == "application/pdf"


def _validate_replay_snapshot() -> None:
    replay_root = ROOT / "work_space" / "replay_history"
    if not replay_root.is_dir():
        return
    candidates = sorted(
        (path for path in replay_root.iterdir() if (path / "replay.json").is_file()),
        key=lambda path: (path / "replay.json").stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        return

    usable = None
    for candidate in candidates:
        snapshot = load_execution_snapshot(str(ROOT / "work_space"), str(candidate))
        stats = snapshot.get("stats") or {}
        if snapshot.get("result") and stats.get("stepCount", 0) > 0 and stats.get("toolCallCount", 0) > 0:
            usable = snapshot
            break

    assert usable is not None, "no completed replay contains a result, stages, and tool evidence"
    assert usable["stats"]["messageCount"] > 0
    assert usable.get("steps") and usable.get("tools")


def _validate_source_contracts() -> None:
    replay_router = (ROOT / "cosight_server/deep_research/routers/search.py").read_text(encoding="utf-8")
    replay_catalog = (ROOT / "cosight_server/deep_research/services/replay_catalog.py").read_text(encoding="utf-8")
    replay_page = (ROOT / "cosight_frontend/src/pages/ReplayPage.tsx").read_text(encoding="utf-8")
    export_button = (ROOT / "cosight_frontend/src/components/documents/DocumentExportButton.tsx").read_text(encoding="utf-8")
    deliverable = (ROOT / "cosight_frontend/src/components/workspace/DocumentDeliverablePanel.tsx").read_text(encoding="utf-8")

    for field in ("step_count", "completed_steps", "blocked_steps", "tool_count", "agent_count", "has_result"):
        assert field in replay_catalog, f"missing replay metadata: {field}"
    assert "list_replay_workspaces" in replay_router
    assert "role=\"alert\"" in replay_page and "loadReplayList" in replay_page
    assert "aria-live=\"polite\"" in export_button and "window.alert" not in export_button
    assert "generationMode: 'template'" in deliverable
    assert "generationMode: 'execution'" in deliverable

    user_facing_sources = [
        ROOT / "cosight_server/deep_research/services/document_export.py",
        ROOT / "cosight_server/deep_research/services/document_generator.py",
        ROOT / "cosight_frontend/src/components/workspace/DocumentDeliverablePanel.tsx",
        ROOT / "cosight_frontend/src/lib/execution-export.ts",
    ]
    forbidden = ("\u4eba\u5de5\u590d\u6838", "\u4eba\u5de5\u5ba1\u9605", "\u5f8b\u5e08\u590d\u6838")
    for path in user_facing_sources:
        source = path.read_text(encoding="utf-8")
        for phrase in forbidden:
            assert phrase not in source, f"legacy review wording remains in {path.name}: {phrase}"


def main() -> int:
    _validate_exports()
    _validate_replay_snapshot()
    _validate_source_contracts()
    print("Phase-6 replay, export, and demo delivery: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
