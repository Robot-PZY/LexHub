"""法规爬取与入库服务。"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from app.common.logger_util import logger
from cosight_server.deep_research.services.legal_kb.chunker import split_law_articles
from cosight_server.deep_research.services.legal_kb.npc_client import NpcLawClient
from cosight_server.deep_research.services.legal_kb.vector_store import get_vector_store


def _config_root() -> Path:
    return Path(__file__).resolve().parents[4] / "config"


def _knowledge_store_dir() -> Path:
    root = os.environ.get("WORKSPACE_PATH") or os.path.join(os.getcwd(), "work_space")
    path = Path(root) / "knowledge_store"
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_crawl_seeds() -> dict[str, Any]:
    path = _config_root() / "knowledge_crawl_seeds.json"
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_platform_seed() -> dict[str, Any]:
    path = _config_root() / "knowledge_platform_seed.json"
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


class LegalCrawlService:
    def __init__(self, *, seen_bbbs: set[str] | None = None):
        self.npc = NpcLawClient()
        self.seen_bbbs = set(seen_bbbs or [])
        self._touched_bbbs: set[str] = set()

    def _ingest_document(
        self,
        *,
        doc,
        seed_id: str | None = None,
        keyword: str | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        if doc.bbbs and doc.bbbs in self.seen_bbbs:
            return {
                "seed_id": seed_id,
                "keyword": keyword,
                "name": doc.title,
                "bbbs": doc.bbbs,
                "status": "skipped",
                "message": "已同步过，跳过",
            }

        chunks = split_law_articles(doc.text, doc.title)
        store_key = seed_id or doc.bbbs
        store_path = _knowledge_store_dir() / f"{store_key}.json"
        store_path.write_text(
            json.dumps({
                "title": doc.title,
                "bbbs": doc.bbbs,
                "source_url": doc.source_url,
                "chunk_count": len(chunks),
                "chunks": [{"title": t, "content": c[:500]} for t, c in chunks[:5]],
            }, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        tag_text = ",".join(tags or [])
        vector_items = []
        for idx, (title, content) in enumerate(chunks):
            vector_items.append({
                "id": f"statute_{doc.bbbs}_{idx}",
                "title": title,
                "content": content,
                "metadata": {
                    "source": "npc_flk",
                    "bbbs": doc.bbbs,
                    "seed_id": seed_id or "",
                    "keyword": keyword or "",
                    "tags": tag_text,
                    "source_url": doc.source_url,
                    "document_title": doc.title,
                    "law_name": doc.title,
                },
            })
        inserted = get_vector_store().add_statutes(vector_items)
        if doc.bbbs:
            self.seen_bbbs.add(doc.bbbs)
            self._touched_bbbs.add(doc.bbbs)

        return {
            "seed_id": seed_id,
            "keyword": keyword,
            "name": doc.title,
            "bbbs": doc.bbbs,
            "status": "ingested",
            "chunks": len(chunks),
            "vectors": inserted,
            "store_file": str(store_path),
        }

    def run(
        self,
        *,
        seed_ids: list[str] | None = None,
        keywords: list[str] | None = None,
        dry_run: bool = False,
    ) -> dict[str, Any]:
        config = load_crawl_seeds()
        seeds = config.get("seeds") or []
        if seed_ids:
            seeds = [item for item in seeds if item.get("id") in seed_ids]

        results: list[dict[str, Any]] = []
        errors: list[str] = []

        for seed in seeds:
            keyword = (seed.get("keywords") or [seed.get("name")])[0]
            try:
                if dry_run:
                    hits = self.npc.search(keyword, page_size=3)
                    results.append({
                        "seed_id": seed.get("id"),
                        "name": seed.get("name"),
                        "status": "dry_run",
                        "hits": [hit.title for hit in hits],
                    })
                    continue

                doc = self.npc.fetch_by_keyword(keyword)
                results.append(self._ingest_document(
                    doc=doc,
                    seed_id=str(seed.get("id") or ""),
                    tags=list(seed.get("tags") or []),
                ))
            except Exception as exc:
                logger.warning("Crawl seed %s failed: %s", seed.get("id"), exc)
                errors.append(f"{seed.get('id')}: {exc}")

        if keywords:
            for keyword in keywords:
                try:
                    if dry_run:
                        hits = self.npc.search(keyword, page_size=3, fuzzy=True)
                        results.append({
                            "keyword": keyword,
                            "status": "dry_run",
                            "hits": [hit.title for hit in hits],
                        })
                        continue
                    doc = self.npc.fetch_by_keyword(keyword)
                    results.append(self._ingest_document(doc=doc, keyword=keyword))
                except Exception as exc:
                    errors.append(f"{keyword}: {exc}")

        return {
            "results": results,
            "errors": errors,
            "dry_run": dry_run,
            "seen_bbbs": sorted(self._touched_bbbs),
        }

    def import_platform_seed(self) -> dict[str, Any]:
        return self._import_seed_items(lambda _item: True)

    def import_contract_seed_pack(self) -> dict[str, Any]:
        """仅 upsert 合同相关模板与类案（可重复执行以更新种子包）。"""
        contract_tags = {"合同", "合同审查", "合同起草", "合同修订", "NDA", "技术服务", "保密", "违约", "知识产权"}

        def _is_contract_item(item: dict[str, Any]) -> bool:
            kind = str(item.get("kind") or "")
            tags = {str(tag) for tag in (item.get("tags") or [])}
            if kind == "template" and tags.intersection(contract_tags):
                return True
            if kind == "case" and "合同" in tags:
                return True
            return False

        return self._import_seed_items(_is_contract_item)

    def _import_seed_items(self, predicate) -> dict[str, Any]:
        payload = load_platform_seed()
        items = [item for item in (payload.get("items") or []) if predicate(item)]
        templates = []
        knowledge = []
        for item in items:
            kind = item.get("kind", "knowledge")
            entry = {
                "id": item.get("id"),
                "title": item.get("title"),
                "content": item.get("content"),
                "metadata": {
                    "tags": ",".join(item.get("tags") or []),
                    "kind": kind,
                    "source": "platform_seed",
                },
            }
            if kind == "template":
                templates.append(entry)
            else:
                knowledge.append(entry)

        store = get_vector_store()
        return {
            "templates": store.add_templates(templates),
            "knowledge": store.add_knowledge(knowledge),
            "total_items": len(items),
            "version": payload.get("version"),
        }
