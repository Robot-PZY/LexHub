#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from cosight_server.deep_research.services.replay_catalog import list_replay_workspaces


def main() -> int:
    with tempfile.TemporaryDirectory() as temp:
        base = Path(temp)
        missing = base / "missing"
        workspace = base / "work_space"
        assert list_replay_workspaces(str(missing), str(workspace)) == []

        replay_root = workspace / "replay_history"
        replay_root.mkdir(parents=True)
        assert list_replay_workspaces(str(replay_root), str(workspace)) == []

        malformed = replay_root / "work_space_malformed"
        malformed.mkdir()
        (malformed / "replay.json").write_text(
            json.dumps({"contentType": "lui-message-manus-step", "content": {"progress": "bad"}}) + "\n",
            encoding="utf-8",
        )
        malformed_items = list_replay_workspaces(str(replay_root), str(workspace))
        assert len(malformed_items) == 1 and malformed_items[0]["status"] == "incomplete"

        task = replay_root / "work_space_test"
        task.mkdir()
        event = {
            "contentType": "lui-message-manus-step",
            "content": {
                "title": "测试事项",
                "steps": ["材料核验"],
                "progress": {"completed": 1, "blocked": 0},
                "step_agent_ids": {"0": "evidence"},
                "result": "测试结果",
            },
        }
        (task / "replay.json").write_text(json.dumps(event, ensure_ascii=False) + "\n", encoding="utf-8")
        items = list_replay_workspaces(str(replay_root), str(workspace))
        completed = next(item for item in items if item["workspace_name"] == "work_space_test")
        assert completed["title"] == "测试事项"
        assert completed["status"] == "completed" and completed["agent_count"] == 1

    replay_page = (ROOT / "cosight_frontend/src/pages/ReplayPage.tsx").read_text(encoding="utf-8")
    assert "暂无历史记录" in replay_page and "发起第一项事项" in replay_page
    assert "role=\"alert\"" in replay_page and "重新读取" in replay_page
    print("Replay empty, populated, and recoverable error states: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
