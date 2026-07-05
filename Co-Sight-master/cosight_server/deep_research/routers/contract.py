"""合同文书 API — LLM + 检索为主；外部 SaaS 接口保留在 legacy 路径。"""

from __future__ import annotations

import asyncio
import base64
from typing import Any, Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from cosight_server.sdk.common.api_result import json_result
from cosight_server.deep_research.services.baidu_textreview import BaiduTextReviewClient
from cosight_server.deep_research.services.contract_documents import (
    CONTRACT_DOCUMENT_CATALOG,
    generate_contract_document,
)
from cosight_server.deep_research.services.document_export import build_export_file
from cosight_server.deep_research.services.explinks_contract import ExplinksContractClient
from cosight_server.deep_research.services.upload_public_url import (
    resolve_public_api_base_url,
    resolve_upload_file_url,
)

contractRouter = APIRouter()


class ContractDocumentGenerateRequest(BaseModel):
    templateId: str = "contract_review_report"
    contractType: str = ""
    partyA: str = ""
    partyB: str = ""
    subjectMatter: str = ""
    keyClauses: str = ""
    contractExcerpt: str = ""
    materialNotes: str = ""
    userGoal: str = ""
    extraInstructions: str = ""
    useResearch: bool = True
    exportFormat: Optional[Literal["md", "docx", "pdf"]] = None


class ExplinksGenerateRequest(BaseModel):
    contractType: str = ""
    partyA: str = ""
    partyB: str = ""
    keyClauses: str = ""
    language: str = ""
    formData: dict[str, Any] = Field(default_factory=dict)


class BaiduReviewSubmitRequest(BaseModel):
    uploadId: Optional[str] = None
    fileName: Optional[str] = None
    sourceUrl: Optional[str] = None
    templateName: Optional[str] = None
    templateId: Optional[str] = None
    commentRiskLevel: str = "major"


class BaiduReviewQueryRequest(BaseModel):
    taskId: str
    poll: bool = False
    startDelaySeconds: int = 30
    pollIntervalSeconds: int = 7
    maxWaitSeconds: int = 300


class BaiduReviewRunRequest(BaiduReviewSubmitRequest):
    startDelaySeconds: int = 30
    pollIntervalSeconds: int = 7
    maxWaitSeconds: int = 300


def _resolve_source_url(payload: BaiduReviewSubmitRequest) -> tuple[str | None, str | None]:
    if payload.sourceUrl:
        return payload.sourceUrl.strip(), None
    if not payload.uploadId:
        return None, "请提供 sourceUrl 或 uploadId"
    source_url = resolve_upload_file_url(payload.uploadId, payload.fileName)
    if not source_url:
        return None, "未找到上传文件，请确认 uploadId / fileName"
    public_base = resolve_public_api_base_url()
    if public_base.startswith("http://127.0.0.1") or public_base.startswith("http://localhost"):
        return source_url, (
            "当前 PUBLIC_API_BASE_URL 为本地地址，百度无法拉取文件。"
            "请在 .env 配置公网可访问地址。"
        )
    return source_url, None


@contractRouter.get("/demo/contract/catalog")
async def contract_catalog():
    import os

    llm_ready = bool(os.environ.get("API_KEY", "").strip())
    return json_result(
        0,
        "success",
        {
            "engine": "llm_rag",
            "llmConfigured": llm_ready,
            "documents": CONTRACT_DOCUMENT_CATALOG,
            "hint": "无需第三方合同 SaaS；填写合同要素或粘贴原文即可生成可导出文书。",
        },
    )


@contractRouter.post("/demo/contract/documents/generate")
async def generate_contract_document_api(body: ContractDocumentGenerateRequest):
    import os

    from cosight_server.deep_research.services.admin_runtime_config import (
        apply_admin_runtime_config,
        is_api_enabled,
    )

    apply_admin_runtime_config()
    if not is_api_enabled("contract_documents"):
        return json_result(1, "合同文书引擎已在管理端停用", None)
    if not os.environ.get("API_KEY", "").strip():
        return json_result(1, "未配置 LLM API_KEY，请在管理端或 .env 中配置任务理解模型", None)
    try:
        generated = await asyncio.to_thread(
            generate_contract_document,
            template_id=body.templateId,
            contract_type=body.contractType,
            party_a=body.partyA,
            party_b=body.partyB,
            subject_matter=body.subjectMatter,
            key_clauses=body.keyClauses,
            contract_excerpt=body.contractExcerpt,
            material_notes=body.materialNotes,
            user_goal=body.userGoal,
            extra_instructions=body.extraInstructions,
            use_research=body.useResearch,
        )
    except ValueError as exc:
        return json_result(1, str(exc), None)
    except RuntimeError as exc:
        return json_result(1, str(exc), None)
    except Exception as exc:
        return json_result(1, f"文书生成失败: {exc}", None)

    payload = dict(generated)
    if body.exportFormat in ("docx", "pdf"):
        content, filename, media_type = build_export_file(
            template_id=body.templateId,
            export_format=body.exportFormat,
            title=generated.get("title"),
            sections=generated.get("sections"),
        )
        payload["export"] = {
            "filename": filename,
            "mediaType": media_type,
            "contentBase64": base64.b64encode(content).decode("ascii"),
        }
    return json_result(0, "success", payload)


@contractRouter.get("/demo/contract/health")
async def contract_health():
    import os

    explinks = ExplinksContractClient()
    baidu = BaiduTextReviewClient()
    llm_ready = bool(os.environ.get("API_KEY", "").strip())
    return json_result(
        0,
        "success",
        {
            "primaryEngine": {
                "id": "contract_documents",
                "configured": llm_ready,
                "label": "合同文书引擎（LLM + 检索）",
            },
            "legacy": {
                "explinks": {"configured": explinks.enabled},
                "baiduTextReview": {"configured": baidu.enabled},
            },
            "publicApiBaseUrl": resolve_public_api_base_url(),
        },
    )


# ----- 以下为可选外部 API（legacy），默认不推荐使用 -----


@contractRouter.post("/demo/contract/legacy/explinks/generate")
async def legacy_explinks_generate(payload: ExplinksGenerateRequest):
    client = ExplinksContractClient()
    if not client.enabled:
        return json_result(1, "未配置 EXPLINKS_API_KEY", None)
    result = await asyncio.to_thread(
        client.generate,
        contract_type=payload.contractType,
        party_a=payload.partyA,
        party_b=payload.partyB,
        key_clauses=payload.keyClauses,
        language=payload.language or None,
        form_data=payload.formData,
    )
    return json_result(0 if result.get("success") else 1, result.get("msg") or "ok", result)


@contractRouter.post("/demo/contract/legacy/baidu/submit")
async def legacy_baidu_submit(payload: BaiduReviewSubmitRequest):
    client = BaiduTextReviewClient()
    if not client.enabled:
        return json_result(1, "未配置百度 TextReview 密钥", None)
    source_url, warning = _resolve_source_url(payload)
    if not source_url:
        return json_result(1, warning or "缺少 source_url", None)
    result = await asyncio.to_thread(
        client.submit_task,
        source_url=source_url,
        template_name=payload.templateName,
        template_id=payload.templateId,
        comment_risk_level=payload.commentRiskLevel,
        file_name=payload.fileName,
    )
    if warning and result.get("success"):
        result["warning"] = warning
    return json_result(0 if result.get("success") else 1, result.get("error_msg") or "ok", result)


@contractRouter.post("/demo/contract/legacy/baidu/query")
async def legacy_baidu_query(payload: BaiduReviewQueryRequest):
    client = BaiduTextReviewClient()
    if not client.enabled:
        return json_result(1, "未配置百度 TextReview 密钥", None)
    if not payload.taskId.strip():
        return json_result(1, "缺少 taskId", None)
    if payload.poll:
        result = await asyncio.to_thread(
            client.poll_task,
            task_id=payload.taskId,
            start_delay_seconds=payload.startDelaySeconds,
            poll_interval_seconds=payload.pollIntervalSeconds,
            max_wait_seconds=payload.maxWaitSeconds,
        )
    else:
        result = await asyncio.to_thread(client.query_task, task_id=payload.taskId)
    return json_result(0 if result.get("success") else 1, result.get("error_msg") or result.get("status") or "ok", result)
