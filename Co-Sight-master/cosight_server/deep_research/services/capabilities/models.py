from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


CapabilityStatus = Literal["running", "success", "failed", "degraded"]
ResultType = Literal[
    "text", "structured_data", "structured_document", "search_results",
    "legal_citations", "calculation", "diff", "file", "image", "report", "verification",
]


class CapabilityDefinition(BaseModel):
    id: str
    name: str
    category: str
    provider: str
    description: str
    allowedAgents: list[str]
    resultType: ResultType
    timeoutSeconds: int = 30
    maxRetries: int = 0
    fallbackCapabilityId: str | None = None
    sensitiveFields: list[str] = Field(default_factory=list)
    enabled: bool = True
    legacyToolNames: list[str] = Field(default_factory=list)


class CapabilityInvocation(BaseModel):
    invocationId: str = Field(default_factory=lambda: f"call_{uuid4().hex}")
    planId: str = "standalone"
    stepId: str = "standalone"
    agentId: str
    capabilityId: str
    input: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)


class CapabilityResult(BaseModel):
    invocationId: str
    capabilityId: str
    status: CapabilityStatus
    summary: str = ""
    resultType: str
    data: Any = None
    artifacts: list[dict[str, Any]] = Field(default_factory=list)
    sources: list[dict[str, Any]] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    error: dict[str, Any] | None = None
    fallback: dict[str, Any] | None = None


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
