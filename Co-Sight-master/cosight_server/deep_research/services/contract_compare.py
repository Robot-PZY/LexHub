"""Deterministic local contract comparison for version negotiation."""

from __future__ import annotations

import difflib
import re
from typing import Any


def _segments(text: str) -> list[str]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not normalized:
        return []
    parts = re.split(r"\n\s*\n|(?<=。)\s*(?=(?:第[一二三四五六七八九十百零0-9]+条|[一二三四五六七八九十]+、|\d+[.、]))", normalized)
    return [re.sub(r"\s+", " ", part).strip() for part in parts if part.strip()]


def compare_contract_texts(original: str, revised: str) -> dict[str, Any]:
    before = _segments(original)
    after = _segments(revised)
    matcher = difflib.SequenceMatcher(a=before, b=after, autojunk=False)
    changes: list[dict[str, Any]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        left = before[i1:i2]
        right = after[j1:j2]
        if tag == "replace":
            pair_count = max(len(left), len(right))
            for offset in range(pair_count):
                old_text = left[offset] if offset < len(left) else ""
                new_text = right[offset] if offset < len(right) else ""
                change_type = "modified" if old_text and new_text else ("deleted" if old_text else "added")
                similarity = difflib.SequenceMatcher(None, old_text, new_text, autojunk=False).ratio() if old_text and new_text else 0.0
                changes.append({
                    "type": change_type,
                    "original": old_text,
                    "revised": new_text,
                    "similarity": round(similarity, 4),
                    "originalIndex": i1 + offset if old_text else None,
                    "revisedIndex": j1 + offset if new_text else None,
                })
        elif tag == "delete":
            changes.extend({"type": "deleted", "original": text, "revised": "", "similarity": 0.0, "originalIndex": i1 + offset, "revisedIndex": None} for offset, text in enumerate(left))
        elif tag == "insert":
            changes.extend({"type": "added", "original": "", "revised": text, "similarity": 0.0, "originalIndex": None, "revisedIndex": j1 + offset} for offset, text in enumerate(right))

    counts = {kind: sum(1 for item in changes if item["type"] == kind) for kind in ("added", "deleted", "modified")}
    unified_diff = "\n".join(difflib.unified_diff(before, after, fromfile="original", tofile="revised", lineterm=""))
    return {
        "summary": {**counts, "totalChanges": len(changes), "originalSections": len(before), "revisedSections": len(after)},
        "changes": changes,
        "unifiedDiff": unified_diff,
    }
