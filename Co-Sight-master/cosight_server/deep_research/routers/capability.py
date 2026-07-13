from __future__ import annotations

import asyncio

from fastapi import APIRouter

from cosight_server.deep_research.services.capabilities import get_capability_executor, get_capability_registry
from cosight_server.deep_research.services.capabilities.models import CapabilityInvocation
from cosight_server.sdk.common.api_result import json_result


capabilityRouter = APIRouter()


@capabilityRouter.get("/demo/capabilities")
async def list_capabilities():
    definitions = [item.model_dump() for item in get_capability_registry().list()]
    return json_result(0, "success", {"capabilities": definitions, "count": len(definitions)})


@capabilityRouter.post("/demo/capabilities/invoke")
async def invoke_capability(payload: CapabilityInvocation):
    result = await asyncio.to_thread(get_capability_executor().invoke, payload)
    return json_result(0 if result.status in {"success", "degraded"} else 1, result.summary, result.model_dump())
