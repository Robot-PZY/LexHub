"""ChromaDB 向量库 — 法规、模板与知识条目本地检索。"""

from __future__ import annotations

import os
import re
from typing import Any

from app.common.logger_util import logger

# 关闭 Chroma 遥测噪音（不影响功能）
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

_vector_store = None


def _resolve_persist_dir() -> str:
    configured = os.environ.get("CHROMA_PERSIST_DIR", "").strip()
    if configured:
        path = os.path.abspath(configured)
    else:
        root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        path = os.path.join(root, "chroma_lexhub")
    os.makedirs(path, exist_ok=True)
    return path


class LegalVectorStore:
    def __init__(self):
        self._client = None
        self._statutes = None
        self._templates = None
        self._knowledge = None

    def _ensure(self) -> bool:
        if self._client is not None:
            return True
        try:
            import chromadb

            host = os.environ.get("CHROMA_HOST", "").strip()
            port = os.environ.get("CHROMA_PORT", "").strip()
            if host and port:
                try:
                    self._client = chromadb.HttpClient(host=host, port=int(port))
                    self._client.heartbeat()
                except Exception:
                    self._client = chromadb.PersistentClient(path=_resolve_persist_dir())
            else:
                self._client = chromadb.PersistentClient(path=_resolve_persist_dir())

            self._statutes = self._client.get_or_create_collection(
                "legal_statutes",
                metadata={"description": "法律法规向量库"},
            )
            self._templates = self._client.get_or_create_collection(
                "document_templates",
                metadata={"description": "文书模板向量库"},
            )
            self._knowledge = self._client.get_or_create_collection(
                "knowledge",
                metadata={"description": "审查规则与知识条目"},
            )
            return True
        except Exception as exc:
            logger.warning("ChromaDB unavailable: %s", exc)
            self._client = None
            return False

    def add_statutes(self, items: list[dict[str, Any]]) -> int:
        if not self._ensure() or not items:
            return 0
        ids = [str(item["id"]) for item in items]
        docs = [f"{item['title']}\n{item['content']}" for item in items]
        metas = [item.get("metadata", {}) for item in items]
        self._statutes.upsert(ids=ids, documents=docs, metadatas=metas)
        return len(ids)

    def add_templates(self, items: list[dict[str, Any]]) -> int:
        if not self._ensure() or not items:
            return 0
        ids = [str(item["id"]) for item in items]
        docs = [f"{item['title']}\n{item['content']}" for item in items]
        metas = [item.get("metadata", {}) for item in items]
        self._templates.upsert(ids=ids, documents=docs, metadatas=metas)
        return len(ids)

    def add_knowledge(self, items: list[dict[str, Any]]) -> int:
        if not self._ensure() or not items:
            return 0
        ids = [str(item["id"]) for item in items]
        docs = [f"{item['title']}\n{item['content']}" for item in items]
        metas = [item.get("metadata", {}) for item in items]
        self._knowledge.upsert(ids=ids, documents=docs, metadatas=metas)
        return len(ids)

    def search(self, collection: str, query: str, *, limit: int = 5) -> list[dict[str, Any]]:
        if not self._ensure() or not query.strip():
            return []
        col = {
            "statutes": self._statutes,
            "templates": self._templates,
            "knowledge": self._knowledge,
        }.get(collection)
        if col is None:
            return []
        try:
            result = col.query(query_texts=[query], n_results=min(limit, 10))
        except Exception as exc:
            logger.warning("Chroma search failed: %s", exc)
            return []
        out: list[dict[str, Any]] = []
        ids = (result.get("ids") or [[]])[0]
        docs = (result.get("documents") or [[]])[0]
        metas = (result.get("metadatas") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]
        for idx, doc_id in enumerate(ids):
            out.append({
                "id": doc_id,
                "content": docs[idx] if idx < len(docs) else "",
                "metadata": metas[idx] if idx < len(metas) else {},
                "score": 1 - (distances[idx] if idx < len(distances) else 1),
                "collection": collection,
            })
        return out

    @staticmethod
    def _extract_law_name(heading: str, meta: dict[str, Any]) -> str:
        if meta.get("law_name"):
            return str(meta["law_name"])
        if meta.get("document_title"):
            return str(meta["document_title"])
        text = (heading or "").strip()
        match = re.match(r"^(.+?)\s+第[一二三四五六七八九十百千万零〇\d]+条", text)
        if match:
            return match.group(1).strip()
        return text.split("\n", 1)[0][:80] or "未命名法规"

    @staticmethod
    def _article_index(doc_id: str) -> int:
        match = re.search(r"_(\d+)$", doc_id or "")
        return int(match.group(1)) if match else 0

    @staticmethod
    def _match_kind(meta: dict[str, Any] | None, kind_filter: str) -> bool:
        if not kind_filter:
            return True
        meta = meta or {}
        kind = str(meta.get("kind", ""))
        tags = str(meta.get("tags", ""))
        if kind_filter == "rule":
            return kind == "rule" or "交叉审查" in tags
        if kind_filter == "case":
            return kind == "case" or "案例" in tags
        return True

    def _format_list_item(
        self,
        doc_id: str,
        document: str,
        metadata: dict[str, Any] | None,
        *,
        collection: str,
        score: float | None = None,
    ) -> dict[str, Any]:
        meta = metadata or {}
        raw = (document or "").strip()
        lines = raw.split("\n", 1)
        heading = (lines[0] if lines else "").strip()
        body = (lines[1] if len(lines) > 1 else raw).strip()

        if collection == "statutes":
            law_name = self._extract_law_name(heading, meta)
            if "第" in heading and "条" in heading:
                chunk_title = heading
                title = law_name
            elif heading and len(heading) < 100:
                chunk_title = heading if heading != law_name else ""
                title = law_name
            else:
                title = law_name
                chunk_title = ""
        else:
            title = meta.get("document_title") or meta.get("title") or heading or doc_id
            chunk_title = heading if heading and heading != title and len(heading) < 80 else ""

        item = {
            "id": doc_id,
            "title": title,
            "chunkTitle": chunk_title,
            "snippet": body[:320] if body else raw[:320],
            "content": body or raw,
            "metadata": meta,
            "collection": collection,
            "tags": [tag.strip() for tag in str(meta.get("tags", "")).split(",") if tag.strip()],
            "source": meta.get("source") or meta.get("law_name") or "",
            "kind": meta.get("kind") or "",
        }
        if score is not None:
            item["score"] = round(score, 4)
        return item

    def list_items(
        self,
        collection: str,
        *,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
        tag: str = "",
        kind: str = "",
    ) -> dict[str, Any]:
        if not self._ensure():
            return {
                "available": False,
                "items": [],
                "total": 0,
                "offset": offset,
                "limit": limit,
                "mode": "browse",
            }

        col = {
            "statutes": self._statutes,
            "templates": self._templates,
            "knowledge": self._knowledge,
        }.get(collection)
        if col is None:
            return {
                "available": True,
                "items": [],
                "total": 0,
                "offset": offset,
                "limit": limit,
                "mode": "browse",
            }

        safe_limit = max(1, min(limit, 50))
        safe_offset = max(0, offset)
        tag_filter = (tag or "").strip()
        kind_filter = (kind or "").strip()

        if query.strip():
            searched = self.search(collection, query.strip(), limit=max(safe_limit, 20))
            filtered = []
            for item in searched:
                meta = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
                if tag_filter and tag_filter not in str(meta.get("tags", "")):
                    continue
                if not self._match_kind(meta, kind_filter):
                    continue
                filtered.append(item)
            items = [
                self._format_list_item(
                    str(item["id"]),
                    str(item.get("content") or ""),
                    item.get("metadata") if isinstance(item.get("metadata"), dict) else {},
                    collection=collection,
                    score=float(item.get("score") or 0),
                )
                for item in filtered[:safe_limit]
            ]
            return {
                "available": True,
                "items": items,
                "total": len(items),
                "offset": 0,
                "limit": safe_limit,
                "mode": "search",
            }

        try:
            if tag_filter or kind_filter:
                all_result = col.get(include=["documents", "metadatas"])
                matched_indices = []
                ids = all_result.get("ids") or []
                metas = all_result.get("metadatas") or []
                for idx, meta in enumerate(metas):
                    meta_dict = meta or {}
                    if tag_filter and tag_filter not in str(meta_dict.get("tags", "")):
                        continue
                    if not self._match_kind(meta_dict, kind_filter):
                        continue
                    matched_indices.append(idx)
                total = len(matched_indices)
                page_indices = matched_indices[safe_offset: safe_offset + safe_limit]
                docs = all_result.get("documents") or []
                items = [
                    self._format_list_item(
                        str(ids[idx]),
                        str(docs[idx] if idx < len(docs) else ""),
                        metas[idx] if idx < len(metas) else {},
                        collection=collection,
                    )
                    for idx in page_indices
                ]
            else:
                total = col.count()
                result = col.get(
                    limit=safe_limit,
                    offset=safe_offset,
                    include=["documents", "metadatas"],
                )
                ids = result.get("ids") or []
                docs = result.get("documents") or []
                metas = result.get("metadatas") or []
                items = [
                    self._format_list_item(
                        str(ids[idx]),
                        str(docs[idx] if idx < len(docs) else ""),
                        metas[idx] if idx < len(metas) else {},
                        collection=collection,
                    )
                    for idx in range(len(ids))
                ]
        except Exception as exc:
            logger.warning("Chroma list failed: %s", exc)
            return {
                "available": True,
                "items": [],
                "total": 0,
                "offset": safe_offset,
                "limit": safe_limit,
                "mode": "browse",
                "error": str(exc),
            }

        return {
            "available": True,
            "items": items,
            "total": total,
            "offset": safe_offset,
            "limit": safe_limit,
            "mode": "browse",
        }

    def library_summary(self) -> dict[str, Any]:
        if not self._ensure():
            return {
                "available": False,
                "lawDocuments": 0,
                "lawArticles": 0,
                "templates": 0,
                "rules": 0,
                "cases": 0,
            }

        docs = self.list_statute_documents(limit=500).get("documents") or []
        law_articles = self._statutes.count()
        knowledge = self._knowledge.get(include=["metadatas"])
        rules = cases = 0
        for meta in knowledge.get("metadatas") or []:
            if self._match_kind(meta or {}, "rule"):
                rules += 1
            elif self._match_kind(meta or {}, "case"):
                cases += 1

        return {
            "available": True,
            "lawDocuments": len(docs),
            "lawArticles": max(0, law_articles - 1),
            "templates": self._templates.count(),
            "rules": rules,
            "cases": cases,
        }

    def list_statute_documents(
        self,
        *,
        query: str = "",
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        if not self._ensure():
            return {"available": False, "documents": [], "total": 0, "offset": offset, "limit": limit}

        result = self._statutes.get(include=["documents", "metadatas"])
        grouped: dict[str, dict[str, Any]] = {}
        ids = result.get("ids") or []
        docs = result.get("documents") or []
        metas = result.get("metadatas") or []

        for idx, doc_id in enumerate(ids):
            meta = metas[idx] if idx < len(metas) else {}
            meta = meta or {}
            doc = str(docs[idx] if idx < len(docs) else "")
            heading = doc.split("\n", 1)[0].strip()
            bbbs = str(meta.get("bbbs") or doc_id.rsplit("_", 1)[0].replace("statute_", ""))
            law_name = self._extract_law_name(heading, meta)
            entry = grouped.get(bbbs)
            if not entry:
                entry = {
                    "bbbs": bbbs,
                    "lawName": law_name,
                    "articleCount": 0,
                    "source": meta.get("source") or "npc_flk",
                    "sourceUrl": meta.get("source_url") or "",
                    "tags": [t.strip() for t in str(meta.get("tags", "")).split(",") if t.strip()],
                }
                grouped[bbbs] = entry
            if "第" in heading and "条" in heading:
                entry["articleCount"] += 1

        documents = sorted(grouped.values(), key=lambda item: item["lawName"])
        q = (query or "").strip()
        if q:
            documents = [item for item in documents if q in item["lawName"]]
        total = len(documents)
        page = documents[offset: offset + limit]
        return {
            "available": True,
            "documents": page,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    def list_statute_articles(
        self,
        bbbs: str,
        *,
        query: str = "",
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        if not self._ensure():
            return {"available": False, "items": [], "total": 0, "offset": offset, "limit": limit}

        result = self._statutes.get(include=["documents", "metadatas"])
        matched: list[tuple[int, str, str, dict[str, Any]]] = []
        ids = result.get("ids") or []
        docs = result.get("documents") or []
        metas = result.get("metadatas") or []

        for idx, doc_id in enumerate(ids):
            meta = metas[idx] if idx < len(metas) else {}
            meta = meta or {}
            if str(meta.get("bbbs") or "") != bbbs:
                continue
            doc = str(docs[idx] if idx < len(docs) else "")
            heading = doc.split("\n", 1)[0].strip()
            if "第" not in heading or "条" not in heading:
                continue
            if query and query not in heading and query not in doc:
                continue
            matched.append((self._article_index(str(doc_id)), str(doc_id), doc, meta))

        matched.sort(key=lambda row: row[0])
        total = len(matched)
        page = matched[offset: offset + limit]
        items = [
            self._format_list_item(doc_id, document, meta, collection="statutes")
            for _, doc_id, document, meta in page
        ]
        law_name = items[0]["title"] if items else ""
        return {
            "available": True,
            "bbbs": bbbs,
            "lawName": law_name,
            "items": items,
            "total": total,
            "offset": offset,
            "limit": limit,
        }

    def stats(self) -> dict[str, Any]:
        if not self._ensure():
            return {"available": False, "persist_dir": _resolve_persist_dir()}
        return {
            "available": True,
            "persist_dir": _resolve_persist_dir(),
            "statutes": self._statutes.count(),
            "templates": self._templates.count(),
            "knowledge": self._knowledge.count(),
        }


def get_vector_store() -> LegalVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = LegalVectorStore()
    return _vector_store
