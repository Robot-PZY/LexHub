"""知识库爬取、向量检索与 LLM 文书生成 API。"""

from __future__ import annotations

import asyncio
import os
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.params import Body
from pydantic import BaseModel, Field

from cosight_server.sdk.common.api_result import json_result
from cosight_server.deep_research.services.document_export import build_export_file
from cosight_server.deep_research.services.document_generator import generate_document_via_llm
from cosight_server.deep_research.services.legal_kb.crawl_service import LegalCrawlService, load_crawl_seeds
from cosight_server.deep_research.services.legal_kb.ingest_service import ingest_text, ingest_upload_file
from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search
from cosight_server.deep_research.services.legal_kb.vector_store import get_vector_store
from app.common.logger_util import logger

knowledgeRouter = APIRouter()


class CrawlRunRequest(BaseModel):
    seedIds: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    dryRun: bool = False


class CrawlScheduleRequest(BaseModel):
    enabled: bool


class VectorSearchRequest(BaseModel):
    query: str
    collection: Literal["statutes", "templates", "knowledge", "all"] = "all"
    limit: int = 5


class LegalSearchRequest(BaseModel):
    query: str
    limit: int = 5


class GenerateDocumentRequest(BaseModel):
    templateId: str = "contract_review_report"
    caseFacts: str
    extraInstructions: str = ""
    useResearch: bool = True
    exportFormat: Optional[Literal["md", "docx", "pdf"]] = None


class IngestTextRequest(BaseModel):
    title: str
    content: str
    collection: Literal["statutes", "templates", "knowledge"] = "knowledge"
    tags: List[str] = Field(default_factory=list)


@knowledgeRouter.get("/demo/knowledge/health")
async def knowledge_health():
    """一键健康检查：Chroma / NPC / 得理 / LLM 配置。"""
    from cosight_server.deep_research.services.legal_kb.delilegal_client import DeliLegalClient
    from cosight_server.deep_research.services.legal_kb.npc_client import NpcLawClient

    store_stats = await asyncio.to_thread(get_vector_store().stats)
    deli = DeliLegalClient()
    npc_ok = False
    try:
        npc_ok = len(await asyncio.to_thread(lambda: NpcLawClient().search("民法典", page_size=1))) > 0
    except Exception:
        npc_ok = False

    llm_ready = bool(os.environ.get("API_KEY", "").strip())
    return json_result(0, "success", {
        "chroma": store_stats,
        "delilegal": {"enabled": deli.enabled, "base_url": deli.base_url},
        "npc": {"reachable": npc_ok},
        "llm": {"configured": llm_ready, "model": os.environ.get("MODEL_NAME", "")},
    })


@knowledgeRouter.get("/demo/knowledge/crawl/seeds")
async def list_crawl_seeds():
    config = load_crawl_seeds()
    return json_result(0, "success", {
        "description": config.get("description"),
        "sources": config.get("sources", []),
        "seeds": config.get("seeds", []),
    })


@knowledgeRouter.post("/demo/knowledge/crawl/run")
async def run_knowledge_crawl(body: CrawlRunRequest):
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import get_seen_bbbs, remember_bbbs

    service = LegalCrawlService(seen_bbbs=get_seen_bbbs())
    result = await asyncio.to_thread(
        service.run,
        seed_ids=body.seedIds or None,
        keywords=body.keywords or None,
        dry_run=body.dryRun,
    )
    for bbbs in result.get("seen_bbbs") or []:
        remember_bbbs(str(bbbs))
    return json_result(0, "success", result)


@knowledgeRouter.get("/demo/knowledge/crawl/status")
async def knowledge_crawl_status():
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import get_schedule_status

    return json_result(0, "success", get_schedule_status())


@knowledgeRouter.put("/demo/knowledge/crawl/schedule")
async def update_knowledge_crawl_schedule(body: CrawlScheduleRequest):
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import set_schedule_enabled

    return json_result(0, "success", set_schedule_enabled(body.enabled))


@knowledgeRouter.post("/demo/knowledge/crawl/run-scheduled")
async def trigger_scheduled_knowledge_crawl():
    from cosight_server.deep_research.services.legal_kb.crawl_scheduler import run_scheduled_crawl

    status = await run_scheduled_crawl(trigger="manual")
    return json_result(0, "success", status)


@knowledgeRouter.post("/demo/knowledge/seed/import")
async def import_platform_seed():
    service = LegalCrawlService()
    result = await asyncio.to_thread(service.import_platform_seed)
    return json_result(0, "success", result)


@knowledgeRouter.post("/demo/knowledge/ingest")
async def ingest_knowledge_text(body: IngestTextRequest):
    if not body.title.strip():
        return json_result(1, "title is required", None)
    if not body.content.strip():
        return json_result(1, "content is required", None)
    try:
        result = await asyncio.to_thread(
            ingest_text,
            title=body.title.strip(),
            content=body.content.strip(),
            collection=body.collection,
            tags=body.tags,
            source="manual",
        )
    except ValueError as exc:
        return json_result(1, str(exc), None)
    except Exception as exc:
        logger.warning("knowledge ingest failed: %s", exc)
        return json_result(1, f"ingest failed: {exc}", None)
    return json_result(0, "success", result)


@knowledgeRouter.post("/demo/knowledge/ingest/upload")
async def ingest_knowledge_upload(
    collection: Literal["statutes", "templates", "knowledge"] = Form("knowledge"),
    tags: str = Form(""),
    files: List[UploadFile] = File(...),
):
    if not files:
        return json_result(1, "files is required", None)

    tag_list = [item.strip() for item in tags.split(",") if item.strip()]
    results: list[dict] = []
    errors: list[str] = []

    for upload in files:
        filename = upload.filename or "upload.txt"
        try:
            data = await upload.read()
            result = await asyncio.to_thread(
                ingest_upload_file,
                filename=filename,
                data=data,
                collection=collection,
                tags=tag_list,
            )
            results.append(result)
        except ValueError as exc:
            errors.append(f"{filename}: {exc}")
        except Exception as exc:
            logger.warning("upload ingest failed for %s: %s", filename, exc)
            errors.append(f"{filename}: {exc}")

    if not results and errors:
        return json_result(1, "; ".join(errors), {"results": [], "errors": errors})

    return json_result(0, "success", {
        "results": results,
        "errors": errors,
        "ingested": len(results),
        "failed": len(errors),
    })


@knowledgeRouter.get("/demo/knowledge/vector/stats")
async def knowledge_vector_stats():
    stats = await asyncio.to_thread(get_vector_store().stats)
    summary = await asyncio.to_thread(get_vector_store().library_summary)
    return json_result(0, "success", {**stats, "libraries": summary})


@knowledgeRouter.get("/demo/knowledge/libraries/summary")
async def knowledge_libraries_summary():
    summary = await asyncio.to_thread(get_vector_store().library_summary)
    return json_result(0, "success", summary)


@knowledgeRouter.get("/demo/knowledge/statutes/documents")
async def knowledge_statute_documents(
    q: str = "",
    limit: int = 20,
    offset: int = 0,
):
    payload = await asyncio.to_thread(
        get_vector_store().list_statute_documents,
        query=(q or "").strip(),
        limit=max(1, min(limit, 50)),
        offset=max(0, offset),
    )
    return json_result(0, "success", payload)


@knowledgeRouter.get("/demo/knowledge/statutes/documents/{bbbs}/articles")
async def knowledge_statute_articles(
    bbbs: str,
    q: str = "",
    limit: int = 20,
    offset: int = 0,
):
    payload = await asyncio.to_thread(
        get_vector_store().list_statute_articles,
        bbbs,
        query=(q or "").strip(),
        limit=max(1, min(limit, 50)),
        offset=max(0, offset),
    )
    return json_result(0, "success", payload)


@knowledgeRouter.get("/demo/knowledge/config")
async def knowledge_config():
    import os

    from cosight_server.deep_research.services.admin_runtime_config import apply_admin_runtime_config

    apply_admin_runtime_config()
    store = get_vector_store()
    stats = await asyncio.to_thread(store.stats)
    summary = await asyncio.to_thread(store.library_summary)
    chroma_dir = os.environ.get("CHROMA_PERSIST_DIR") or "./chroma_lexhub"
    templates = int(summary.get("templates") or 0)
    cases = int(summary.get("cases") or 0)
    law_articles = int(summary.get("lawArticles") or 0)
    contract_ready = templates >= 3 and (law_articles > 0 or cases >= 2)
    steps: list[dict[str, str]] = []
    if not summary.get("available"):
        steps.append({"id": "chroma", "label": "启动后端并确认 Chroma 目录可写", "status": "pending"})
    elif templates < 3:
        steps.append({"id": "seed", "label": "导入「合同文书种子包」或初始化演示数据", "status": "pending"})
    else:
        steps.append({"id": "seed", "label": "文书模板已就绪", "status": "done"})
    if law_articles < 1:
        steps.append({"id": "law", "label": "在数据导入中同步 NPC 法规（建议：民法典、劳动合同法）", "status": "pending"})
    else:
        steps.append({"id": "law", "label": f"法规库已收录约 {law_articles} 条", "status": "done"})
    if cases < 2:
        steps.append({"id": "cases", "label": "导入类案演示数据以增强合同场景检索", "status": "pending"})
    else:
        steps.append({"id": "cases", "label": f"类案参考 {cases} 条", "status": "done"})
    steps.append({
        "id": "documents",
        "label": "在智能工作台选场景填表单，于任务结果验证文书生成",
        "status": "done" if contract_ready else "pending",
    })
    return json_result(0, "success", {
        "chromaPersistDir": chroma_dir,
        "available": bool(summary.get("available")),
        "stats": stats,
        "libraries": summary,
        "contractReadiness": {
            "ready": contract_ready,
            "templates": templates,
            "cases": cases,
            "lawArticles": law_articles,
        },
        "recommendedSteps": steps,
        "collections": [
            {"id": "statutes", "label": "法规库", "role": "legal_search"},
            {"id": "templates", "label": "文书模板库", "role": "contract_draft"},
            {"id": "knowledge", "label": "类案与规则", "role": "case_rule"},
        ],
    })


@knowledgeRouter.post("/demo/knowledge/seed/contract-pack")
async def import_contract_seed_pack():
    service = LegalCrawlService()
    result = await asyncio.to_thread(service.import_contract_seed_pack)
    summary = await asyncio.to_thread(get_vector_store().library_summary)
    return json_result(0, "success", {"import": result, "libraries": summary})


@knowledgeRouter.post("/demo/knowledge/bootstrap")
async def knowledge_bootstrap():
    store = get_vector_store()
    stats = await asyncio.to_thread(store.stats)
    imported = False
    seed_result: dict[str, Any] | None = None
    templates = int(stats.get("templates") or 0)
    knowledge = int(stats.get("knowledge") or 0)
    if templates < 3 or knowledge < 6:
        service = LegalCrawlService()
        seed_result = await asyncio.to_thread(service.import_platform_seed)
        imported = True
    summary = await asyncio.to_thread(store.library_summary)
    return json_result(0, "success", {
        "imported": imported,
        "seed": seed_result,
        "libraries": summary,
    })


@knowledgeRouter.get("/demo/knowledge/vector/items")
async def knowledge_vector_items(
    collection: Literal["statutes", "templates", "knowledge"] = "knowledge",
    limit: int = 15,
    offset: int = 0,
    q: str = "",
    tag: str = "",
    kind: str = "",
):
    payload = await asyncio.to_thread(
        get_vector_store().list_items,
        collection,
        limit=max(1, min(limit, 50)),
        offset=max(0, offset),
        query=(q or "").strip(),
        tag=(tag or "").strip(),
        kind=(kind or "").strip(),
    )
    return json_result(0, "success", payload)


@knowledgeRouter.post("/demo/knowledge/vector/search")
async def knowledge_vector_search(body: VectorSearchRequest):
    store = get_vector_store()
    if body.collection == "all":
        results = []
        for name in ("statutes", "templates", "knowledge"):
            chunk = await asyncio.to_thread(store.search, name, body.query, limit=body.limit)
            results.extend(chunk)
        results.sort(key=lambda item: item.get("score", 0), reverse=True)
        return json_result(0, "success", {"results": results[: body.limit]})

    results = await asyncio.to_thread(store.search, body.collection, body.query, limit=body.limit)
    return json_result(0, "success", {"results": results})


@knowledgeRouter.post("/demo/legal-search")
async def legal_search(body: LegalSearchRequest):
    if not body.query.strip():
        return json_result(1, "query is required", None)
    data = await asyncio.to_thread(hybrid_legal_search, body.query, limit=body.limit)
    return json_result(0, "success", data)


@knowledgeRouter.post("/demo/generate-document")
async def generate_document_api(body: GenerateDocumentRequest = Body(...)):
    if not body.caseFacts.strip():
        return json_result(1, "caseFacts is required", None)

    from cosight_server.deep_research.services.admin_runtime_config import apply_admin_runtime_config
    from cosight_server.deep_research.services.document_research import build_document_research_context

    apply_admin_runtime_config()

    research_context: list[dict[str, Any]] = []
    if body.useResearch:
        try:
            research_context = await asyncio.to_thread(
                build_document_research_context,
                body.caseFacts,
                limit_per_query=5,
            )
        except Exception as exc:
            logger.warning("research context fetch failed: %s", exc)

    try:
        generated = await asyncio.to_thread(
            generate_document_via_llm,
            template_id=body.templateId,
            case_facts=body.caseFacts,
            extra_instructions=body.extraInstructions,
            research_context=research_context,
        )
    except RuntimeError as exc:
        return json_result(1, str(exc), None)

    payload = {
        **generated,
        "researchUsed": len(research_context),
    }

    if body.exportFormat in ("docx", "pdf"):
        content, filename, media_type = build_export_file(
            template_id=body.templateId,
            export_format=body.exportFormat,
            title=generated.get("title"),
            sections=generated.get("sections"),
        )
        import base64
        payload["export"] = {
            "filename": filename,
            "mediaType": media_type,
            "contentBase64": base64.b64encode(content).decode("ascii"),
        }

    return json_result(0, "success", payload)
