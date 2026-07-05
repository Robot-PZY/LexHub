"""知识库手动入库：文本 / 文件解析与向量化。"""

from __future__ import annotations

import hashlib
import json
import re
import tempfile
import uuid
from pathlib import Path
from typing import Any, Literal

from app.common.logger_util import logger
from cosight_server.deep_research.services.legal_kb.chunker import split_generic_document, split_law_articles
from cosight_server.deep_research.services.legal_kb.vector_store import get_vector_store

CollectionName = Literal["statutes", "templates", "knowledge"]
SUPPORTED_EXTENSIONS = {".txt", ".md", ".docx"}


def _knowledge_store_dir() -> Path:
    import os

    root = os.environ.get("WORKSPACE_PATH") or str(Path.cwd() / "work_space")
    path = Path(root) / "knowledge_store" / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", (value or "").strip())
    return cleaned[:48] or "doc"


def _stable_id(prefix: str, title: str, idx: int) -> str:
    digest = hashlib.md5(f"{title}:{idx}".encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{digest}_{idx}"


def _extract_docx_text(data: bytes) -> str:
    try:
        from docx import Document

        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as handle:
            handle.write(data)
            tmp_path = Path(handle.name)
        try:
            doc = Document(str(tmp_path))
            lines = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
            return "\n".join(lines)
        finally:
            tmp_path.unlink(missing_ok=True)
    except Exception as exc:
        logger.warning("DOCX extract failed: %s", exc)
        return ""


def read_upload_bytes(filename: str, data: bytes) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"不支持的文件类型 {ext}，仅支持 txt / md / docx")
    if ext in {".txt", ".md"}:
        text = data.decode("utf-8", errors="replace").strip()
    else:
        text = _extract_docx_text(data).strip()
    if not text:
        raise ValueError(f"无法从 {filename} 提取有效文本")
    return text


def _chunk_document(title: str, content: str, collection: CollectionName) -> list[tuple[str, str]]:
    if collection == "statutes":
        return split_law_articles(content, title)
    return split_generic_document(content, title)


def ingest_text(
    *,
    title: str,
    content: str,
    collection: CollectionName = "knowledge",
    tags: list[str] | None = None,
    source: str = "manual",
    filename: str | None = None,
) -> dict[str, Any]:
    title = (title or "").strip()
    content = (content or "").strip()
    if not title:
        raise ValueError("title is required")
    if not content:
        raise ValueError("content is required")

    tag_text = ",".join(tags or [])
    doc_key = _slug(filename or title)
    store_path = _knowledge_store_dir() / f"{doc_key}.json"
    chunks = _chunk_document(title, content, collection)
    prefix = {"statutes": "statute", "templates": "template", "knowledge": "knowledge"}[collection]

    vector_items: list[dict[str, Any]] = []
    for idx, (chunk_title, chunk_content) in enumerate(chunks):
        vector_items.append({
            "id": _stable_id(prefix, f"{title}:{chunk_title}", idx),
            "title": chunk_title,
            "content": chunk_content,
            "metadata": {
                "source": source,
                "collection": collection,
                "document_title": title,
                "filename": filename or "",
                "tags": tag_text,
            },
        })

    store = get_vector_store()
    if collection == "statutes":
        inserted = store.add_statutes(vector_items)
    elif collection == "templates":
        inserted = store.add_templates(vector_items)
    else:
        inserted = store.add_knowledge(vector_items)

    store_path.write_text(
        json.dumps({
            "title": title,
            "collection": collection,
            "source": source,
            "filename": filename,
            "chunk_count": len(chunks),
            "vectors": inserted,
            "chunks": [{"title": t, "content": c[:500]} for t, c in chunks[:5]],
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return {
        "title": title,
        "collection": collection,
        "source": source,
        "filename": filename,
        "chunks": len(chunks),
        "vectors": inserted,
        "store_file": str(store_path),
        "status": "ingested",
    }


def ingest_upload_file(
    *,
    filename: str,
    data: bytes,
    collection: CollectionName = "knowledge",
    tags: list[str] | None = None,
) -> dict[str, Any]:
    text = read_upload_bytes(filename, data)
    title = Path(filename).stem.strip() or f"upload_{uuid.uuid4().hex[:8]}"
    return ingest_text(
        title=title,
        content=text,
        collection=collection,
        tags=tags,
        source="upload",
        filename=filename,
    )
