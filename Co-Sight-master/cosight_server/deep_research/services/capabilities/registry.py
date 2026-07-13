from __future__ import annotations

from .models import CapabilityDefinition


class CapabilityRegistry:
    def __init__(self) -> None:
        definitions = [
            CapabilityDefinition(
                id="document_parse",
                name="文档解析 / OCR",
                category="document_tool",
                provider="lexhub_baidu",
                description="解析本地材料；文本稀疏时自动使用百度文档解析或 OCR。",
                allowedAgents=["evidence"],
                resultType="structured_document",
                timeoutSeconds=150,
                maxRetries=0,
                fallbackCapabilityId="baidu_ocr",
                sensitiveFields=["apiKey", "secretKey", "accessToken"],
                legacyToolNames=["extract_document_content", "document_processor", "pdf_reader", "image_ocr"],
            ),
            CapabilityDefinition(
                id="legal_search",
                name="法律法规检索",
                category="knowledge_tool",
                provider="delilegal_npc_chroma",
                description="组合得理、国家法律法规数据库与本地 Chroma 结果。",
                allowedAgents=["research"],
                resultType="legal_citations",
                timeoutSeconds=30,
                maxRetries=1,
                sensitiveFields=["apiKey", "secret"],
                legacyToolNames=["legal_search"],
            ),
            CapabilityDefinition(
                id="contract_compare",
                name="合同版本比对",
                category="local_service",
                provider="lexhub_local",
                description="本地完成合同条款增删改、相似度与统一 diff。",
                allowedAgents=["clause_risk"],
                resultType="diff",
                timeoutSeconds=10,
                maxRetries=0,
                legacyToolNames=["contract_compare"],
            ),
        ]
        self._definitions = {item.id: item for item in definitions}
        self._legacy_map = {
            tool_name: item.id
            for item in definitions
            for tool_name in item.legacyToolNames
        }

    def list(self) -> list[CapabilityDefinition]:
        return list(self._definitions.values())

    def get(self, capability_id: str) -> CapabilityDefinition | None:
        return self._definitions.get(capability_id)

    def resolve_legacy_tool(self, tool_name: str) -> CapabilityDefinition | None:
        capability_id = self._legacy_map.get(tool_name)
        return self.get(capability_id) if capability_id else None


_registry = CapabilityRegistry()


def get_capability_registry() -> CapabilityRegistry:
    return _registry
