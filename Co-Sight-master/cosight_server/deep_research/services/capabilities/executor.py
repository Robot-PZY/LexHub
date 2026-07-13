from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Callable

from app.cosight.tool.document_processing_toolkit import DocumentProcessingToolkit
from cosight_server.deep_research.services.contract_compare import compare_contract_texts
from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search

from .models import CapabilityInvocation, CapabilityResult
from .registry import CapabilityRegistry, get_capability_registry


class CapabilityExecutor:
    def __init__(self, registry: CapabilityRegistry) -> None:
        self.registry = registry
        self._handlers: dict[str, Callable[[dict[str, Any]], Any]] = {
            "document_parse": self._document_parse,
            "legal_search": self._legal_search,
            "contract_compare": self._contract_compare,
        }

    @staticmethod
    def _safe_document_path(raw_path: str) -> Path:
        path = Path(raw_path).expanduser().resolve()
        root = Path(os.getcwd()).resolve()
        if path != root and root not in path.parents:
            raise ValueError("Document path must stay inside the LexHub workspace")
        if not path.is_file():
            raise FileNotFoundError(str(path))
        return path

    def _document_parse(self, payload: dict[str, Any]) -> dict[str, Any]:
        path = self._safe_document_path(str(payload.get("filePath") or ""))
        content = DocumentProcessingToolkit().extract_document_content(str(path))
        return {"fileName": path.name, "content": content, "characterCount": len(str(content))}

    @staticmethod
    def _legal_search(payload: dict[str, Any]) -> dict[str, Any]:
        query = str(payload.get("query") or "").strip()
        if not query:
            raise ValueError("query is required")
        limit = max(1, min(int(payload.get("limit") or 5), 10))
        return hybrid_legal_search(query, limit=limit)

    @staticmethod
    def _contract_compare(payload: dict[str, Any]) -> dict[str, Any]:
        original = str(payload.get("originalText") or "")
        revised = str(payload.get("revisedText") or "")
        if not original.strip() or not revised.strip():
            raise ValueError("originalText and revisedText are required")
        return compare_contract_texts(original, revised)

    def invoke(self, invocation: CapabilityInvocation) -> CapabilityResult:
        definition = self.registry.get(invocation.capabilityId)
        if definition is None or not definition.enabled:
            return CapabilityResult(
                invocationId=invocation.invocationId,
                capabilityId=invocation.capabilityId,
                status="failed",
                summary="能力未注册或未启用",
                resultType="structured_data",
                error={"code": "CAPABILITY_NOT_AVAILABLE", "message": "Capability not available"},
            )
        if invocation.agentId not in definition.allowedAgents and invocation.agentId != "standalone":
            return CapabilityResult(
                invocationId=invocation.invocationId,
                capabilityId=definition.id,
                status="failed",
                summary="当前智能体无权调用该能力",
                resultType=definition.resultType,
                error={"code": "AGENT_NOT_ALLOWED", "message": f"{invocation.agentId} cannot invoke {definition.id}"},
            )
        handler = self._handlers.get(definition.id)
        if handler is None:
            raise RuntimeError(f"No handler for capability {definition.id}")
        started = time.monotonic()
        try:
            data = handler(invocation.input)
            duration_ms = round((time.monotonic() - started) * 1000)
            summary = self._summarize(definition.id, data)
            return CapabilityResult(
                invocationId=invocation.invocationId,
                capabilityId=definition.id,
                status="success",
                summary=summary,
                resultType=definition.resultType,
                data=data,
                sources=self._sources(definition.id, invocation.input, data),
                metrics={"durationMs": duration_ms, "provider": definition.provider},
            )
        except Exception as exc:
            return CapabilityResult(
                invocationId=invocation.invocationId,
                capabilityId=definition.id,
                status="failed",
                summary=f"{definition.name}调用失败",
                resultType=definition.resultType,
                metrics={"durationMs": round((time.monotonic() - started) * 1000), "provider": definition.provider},
                error={"code": type(exc).__name__, "message": str(exc)[:500]},
            )

    @staticmethod
    def _summarize(capability_id: str, data: Any) -> str:
        if capability_id == "document_parse":
            return f"已解析 {data.get('fileName')}，得到 {data.get('characterCount', 0)} 个字符"
        if capability_id == "legal_search":
            return f"检索到 {len(data.get('laws') or [])} 条法规、{len(data.get('cases') or [])} 个案例和 {len(data.get('local') or [])} 条本地资料"
        if capability_id == "contract_compare":
            summary = data.get("summary") or {}
            return f"发现 {summary.get('totalChanges', 0)} 项变化：新增 {summary.get('added', 0)}、删除 {summary.get('deleted', 0)}、修改 {summary.get('modified', 0)}"
        return "能力调用完成"

    @staticmethod
    def _sources(capability_id: str, request: dict[str, Any], data: Any) -> list[dict[str, Any]]:
        if capability_id == "document_parse":
            return [{"type": "file", "name": data.get("fileName"), "path": request.get("filePath")}]
        if capability_id == "legal_search":
            return [{"type": "provider", "name": name} for name in data.get("sources") or []]
        return [{"type": "local", "name": "LexHub"}]


def normalize_legacy_tool_result(tool_name: str, raw_result: Any, *, invocation_id: str, duration_ms: int | None = None, error: str | None = None) -> dict[str, Any] | None:
    definition = get_capability_registry().resolve_legacy_tool(tool_name)
    if definition is None:
        return None
    parsed: Any = raw_result
    if isinstance(raw_result, str):
        try:
            parsed = json.loads(raw_result)
        except Exception:
            parsed = raw_result
    return CapabilityResult(
        invocationId=invocation_id,
        capabilityId=definition.id,
        status="failed" if error else "success",
        summary=(f"{definition.name}调用失败" if error else f"{definition.name}调用完成"),
        resultType=definition.resultType,
        data=None if error else parsed,
        metrics={"durationMs": duration_ms} if duration_ms is not None else {},
        error={"code": "TOOL_ERROR", "message": error[:500]} if error else None,
    ).model_dump()


_executor = CapabilityExecutor(get_capability_registry())


def get_capability_executor() -> CapabilityExecutor:
    return _executor
