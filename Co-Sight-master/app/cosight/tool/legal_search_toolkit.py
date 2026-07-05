"""律枢法律检索工具 — 供 Co-Sight Actor 调用。"""

from __future__ import annotations

import json
from typing import Any

from app.common.logger_util import logger


def legal_search(query: str, limit: int = 5) -> str:
    """混合法规检索：得理 API + NPC 公开库 + 本地 Chroma。"""
    query = (query or "").strip()
    if not query:
        return "请提供检索关键词。"

    try:
        from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search

        data: dict[str, Any] = hybrid_legal_search(query, limit=min(max(limit, 1), 10))
    except Exception as exc:
        logger.warning("legal_search tool failed: %s", exc)
        return f"法律检索失败: {exc}"

    laws = data.get("laws") or []
    cases = data.get("cases") or []
    local = data.get("local") or []
    sources = data.get("sources") or []

    lines = [f"检索词：{query}", f"数据源：{', '.join(sources) or '无'}", ""]

    if laws:
        lines.append("【法规】")
        for item in laws[:limit]:
            title = item.get("title") or item.get("id") or "未知"
            snippet = (item.get("content") or item.get("summary") or "")[:400]
            url = item.get("url") or item.get("source_url") or ""
            lines.append(f"- {title}")
            if snippet:
                lines.append(f"  {snippet}")
            if url:
                lines.append(f"  来源: {url}")
        lines.append("")

    if cases:
        lines.append("【案例/裁判】")
        for item in cases[: min(3, limit)]:
            title = item.get("title") or item.get("caseName") or "未知"
            snippet = (item.get("content") or item.get("summary") or "")[:300]
            lines.append(f"- {title}")
            if snippet:
                lines.append(f"  {snippet}")
        lines.append("")

    if local:
        lines.append("【本地知识库】")
        for item in local[: min(3, limit)]:
            meta = item.get("metadata") or {}
            title = item.get("title") or meta.get("document_title") or item.get("id") or "条目"
            collection = item.get("collection") or meta.get("collection") or ""
            snippet = (item.get("content") or "")[:300]
            label = f"{title} ({collection})" if collection else title
            lines.append(f"- {label} (score={item.get('score', 0):.2f})")
            if snippet:
                lines.append(f"  {snippet}")

    templates = data.get("templates") or []
    if templates:
        lines.append("")
        lines.append("【文书模板】")
        for item in templates[: min(3, limit)]:
            title = item.get("title") or item.get("id") or "模板"
            snippet = (item.get("content") or "")[:300]
            lines.append(f"- {title} (score={item.get('score', 0):.2f})")
            if snippet:
                lines.append(f"  {snippet}")

    if not laws and not cases and not local:
        return f"未检索到与「{query}」相关的法规或案例，请换用更具体的关键词。"

    return "\n".join(lines)
