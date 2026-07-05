"""混合法规检索：得理 API + NPC 公开库 + 本地 Chroma。"""

from __future__ import annotations

from typing import Any

from cosight_server.deep_research.services.legal_kb.delilegal_client import DeliLegalClient
from cosight_server.deep_research.services.legal_kb.npc_client import NpcLawClient
from cosight_server.deep_research.services.legal_kb.vector_store import get_vector_store


def _normalize_local_hit(hit: dict[str, Any]) -> dict[str, Any]:
    meta = hit.get("metadata") or {}
    content = hit.get("content") or ""
    title = (
        meta.get("document_title")
        or meta.get("title")
        or (content.split("\n", 1)[0] if content else "")
        or hit.get("id")
        or "本地条目"
    )
    return {
        **hit,
        "title": str(title)[:200],
        "source": hit.get("collection") or "chroma_local",
    }


def hybrid_legal_search(query: str, *, limit: int = 5) -> dict[str, Any]:
    query = (query or "").strip()
    if not query:
        return {"laws": [], "cases": [], "local": [], "templates": [], "sources": []}

    laws: list[dict[str, Any]] = []
    cases: list[dict[str, Any]] = []
    local: list[dict[str, Any]] = []
    sources: list[str] = []

    deli = DeliLegalClient()
    if deli.enabled:
        laws.extend(deli.search_law(query, limit=limit))
        cases.extend(deli.search_case(query, limit=limit))
        if laws or cases:
            sources.append("delilegal")

    npc = NpcLawClient()
    try:
        npc_hits = npc.search_law(query, limit=limit)
        for hit in npc_hits:
            if not any(item.get("title") == hit.get("title") for item in laws):
                laws.append(hit)
        if npc_hits:
            sources.append("npc_flk")
    except Exception:
        pass

    store = get_vector_store()
    for collection in ("statutes", "templates", "knowledge"):
        chunk_limit = limit if collection != "knowledge" else max(2, limit // 2)
        hits = store.search(collection, query, limit=chunk_limit)
        local.extend(_normalize_local_hit(item) for item in hits)
    if local:
        sources.append("chroma_local")

    local.sort(key=lambda item: item.get("score", 0), reverse=True)
    trimmed_local = local[: limit * 2]
    templates = [item for item in trimmed_local if item.get("collection") == "templates"][:limit]

    return {
        "query": query,
        "laws": laws[:limit],
        "cases": cases[:limit],
        "local": trimmed_local[:limit],
        "templates": templates,
        "sources": sources,
    }
