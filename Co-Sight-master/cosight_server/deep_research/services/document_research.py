"""文书生成前的法规检索上下文构建。"""

from __future__ import annotations

import re
from typing import Any

from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search
from cosight_server.deep_research.services.legal_kb.task_backfill import extract_crawl_keywords


def _normalize_hit(hit: dict[str, Any], *, source_bucket: str, index: int) -> dict[str, Any]:
    meta = hit.get("metadata") or {}
    title = (
        hit.get("title")
        or meta.get("document_title")
        or meta.get("title")
        or hit.get("id")
        or f"依据{index}"
    )
    content = (hit.get("content") or hit.get("summary") or "").strip()
    source = hit.get("source") or meta.get("source") or source_bucket
    return {
        "ref_id": f"依据{index}",
        "title": str(title)[:200],
        "content": content[:800],
        "source": source,
        "source_url": hit.get("source_url") or hit.get("url") or meta.get("source_url") or "",
        "bucket": source_bucket,
    }


def _research_queries(case_facts: str) -> list[str]:
    text = (case_facts or "").strip()
    if not text:
        return []

    queries: list[str] = []
    for keyword in extract_crawl_keywords(text, max_keywords=2):
        queries.append(keyword)

    for match in re.finditer(r"用户诉求[：:]\s*(.+)", text):
        segment = match.group(1).strip()[:60]
        if len(segment) >= 4:
            queries.append(segment)

    for match in re.finditer(r"执行结论[：:]\s*(.+)", text):
        segment = match.group(1).strip()[:60]
        if len(segment) >= 6:
            queries.append(segment)

    if not queries:
        first_line = text.split("\n", 1)[0].strip()[:80]
        if len(first_line) >= 4:
            queries.append(first_line)

    seen: set[str] = set()
    out: list[str] = []
    for query in queries:
        key = query.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(query)
        if len(out) >= 3:
            break
    return out


def build_document_research_context(case_facts: str, *, limit_per_query: int = 4) -> list[dict[str, Any]]:
    """从案件事实提取检索词，聚合法规/案例/本地/模板依据。"""
    queries = _research_queries(case_facts)
    if not queries:
        queries = ["合同 违约责任"]

    seen_titles: set[str] = set()
    items: list[dict[str, Any]] = []
    index = 1

    for query in queries:
        data = hybrid_legal_search(query, limit=limit_per_query)
        for bucket in ("laws", "cases", "local", "templates"):
            for hit in data.get(bucket) or []:
                title = str(hit.get("title") or hit.get("id") or "").strip()
                if not title or title in seen_titles:
                    continue
                seen_titles.add(title)
                items.append(_normalize_hit(hit, source_bucket=bucket, index=index))
                index += 1
                if len(items) >= 12:
                    return items
    return items


def format_research_context_for_prompt(items: list[dict[str, Any]]) -> str:
    if not items:
        return "（未检索到可用依据，请在文书中标注「需补充法规检索」并避免捏造法条。）"

    lines = [
        "以下为依据清单，正文引用时请使用 [依据N] 标注，不得引用清单外的具体法条条文号：",
        "",
    ]
    for item in items:
        lines.append(f"[{item['ref_id']}] {item['title']}（来源：{item['source']}）")
        if item.get("content"):
            lines.append(f"    摘要：{item['content'][:500]}")
        if item.get("source_url"):
            lines.append(f"    链接：{item['source_url']}")
        lines.append("")
    return "\n".join(lines).strip()
