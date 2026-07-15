"""管理端运行时配置：持久化到 config/runtime/，并在任务启动前 overlay 到 os.environ。"""

from __future__ import annotations

import json
import os
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from app.common.logger_util import logger

_PROJECT_ROOT = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
_RUNTIME_DIR = os.path.join(_PROJECT_ROOT, "config", "runtime")
_SETTINGS_PATH = os.path.join(_RUNTIME_DIR, "admin_settings.json")
_CUSTOM_MCP_PATH = os.path.join(_RUNTIME_DIR, "custom_mcp_tools.json")
_CUSTOM_TOOL_SOURCE_DIR = os.path.join(_RUNTIME_DIR, "custom_tools")

MODEL_ROLE_PREFIX = {
    "planner": "PLAN",
    "vision": "VISION",
    "research": "ACT",
    "drafting": "TOOL",
    "review": "CREDIBILITY",
}

DEFAULT_SETTINGS: dict[str, Any] = {
    "version": 2,
    "updatedAt": None,
    "modelProviders": [
        {"id": "openai", "label": "OpenAI", "presetId": "openai", "protocol": "openai_compatible", "baseUrl": "https://api.openai.com/v1", "apiKey": "", "enabled": False},
        {"id": "gemini", "label": "Google Gemini", "presetId": "gemini", "protocol": "openai_compatible", "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai/", "apiKey": "", "enabled": False},
        {"id": "openrouter", "label": "OpenRouter", "presetId": "openrouter", "protocol": "openai_compatible", "baseUrl": "https://openrouter.ai/api/v1", "apiKey": "", "enabled": False},
        {"id": "deepseek", "label": "DeepSeek", "presetId": "deepseek", "protocol": "openai_compatible", "baseUrl": "https://api.deepseek.com/v1", "apiKey": "", "enabled": True},
        {"id": "qwen", "label": "通义千问", "presetId": "qwen", "protocol": "openai_compatible", "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1", "apiKey": "", "enabled": False},
        {"id": "zhipu", "label": "智谱 GLM", "presetId": "zhipu", "protocol": "openai_compatible", "baseUrl": "https://open.bigmodel.cn/api/paas/v4", "apiKey": "", "enabled": False},
        {"id": "moonshot", "label": "Kimi / Moonshot", "presetId": "moonshot", "protocol": "openai_compatible", "baseUrl": "https://api.moonshot.cn/v1", "apiKey": "", "enabled": False},
        {"id": "custom", "label": "自定义兼容接口", "presetId": "custom", "protocol": "openai_compatible", "baseUrl": "", "apiKey": "", "enabled": False},
    ],
    "modelSlots": [
        {"id": "language", "label": "主语言模型", "description": "统一用于任务规划、法律分析、文书生成与结果复核。", "providerId": "deepseek", "modelName": "deepseek-v4-flash", "enabled": True, "capabilities": ["text", "reasoning"]},
        {"id": "vision", "label": "视觉理解模型", "description": "用于图片、扫描件、复杂 PDF 与表格内容理解。", "providerId": "qwen", "modelName": "qwen-vl-max", "enabled": True, "capabilities": ["vision", "document"]},
    ],
    "models": [],
    "apis": [
        {"id": "ocr", "providerId": "baidu-ocr", "name": "OCR / 文档解析", "category": "材料处理", "purpose": "识别合同、扫描件与 PDF 材料。", "integrationType": "ocr_service", "dependsOn": ["vision"], "apiKey": "", "endpoint": "https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic", "enabled": True},
        {"id": "legal_search", "providerId": "delilegal", "name": "得理法律检索", "category": "法律研究", "purpose": "检索法规、司法解释与裁判案例。", "integrationType": "search_api", "dependsOn": ["research"], "apiKey": "", "endpoint": "https://openapi.delilegal.com", "enabled": True},
        {"id": "contract_documents", "providerId": "builtin", "name": "合同文书引擎", "category": "合同文书", "purpose": "生成审查报告、合同草稿与条款修改建议。", "integrationType": "rest_api", "dependsOn": ["drafting", "research"], "apiKey": "", "endpoint": "", "enabled": True},
        {"id": "contract_review_external", "providerId": "baidu", "name": "第三方审查文档交付（可选）", "category": "合同文书", "purpose": "异步生成批注版合同与审查报告下载链接。", "integrationType": "rest_api", "dependsOn": ["review"], "apiKey": "", "endpoint": "https://aip.baidubce.com", "enabled": False},
        {"id": "contract_compare", "providerId": "builtin", "name": "合同版本比对（本地）", "category": "合同审查", "purpose": "多版本合同差异与修订痕迹比对。", "integrationType": "rest_api", "dependsOn": ["review"], "apiKey": "", "endpoint": "/api/demo/contract/compare", "enabled": True},
        {"id": "web_search", "providerId": "tavily", "name": "联网搜索", "category": "公开资料", "purpose": "补充公开资料与行业背景。", "integrationType": "search_api", "dependsOn": [], "apiKey": "", "endpoint": "https://api.tavily.com/search", "enabled": False},
        {"id": "export", "providerId": "builtin", "name": "文书导出", "category": "结果交付", "purpose": "导出 PDF / DOCX / 材料包。", "integrationType": "export_pipeline", "dependsOn": ["drafting"], "apiKey": "", "endpoint": "", "enabled": True},
        {"id": "vector_rag", "providerId": "builtin", "name": "本地知识库 / RAG", "category": "知识增强", "purpose": "接入法规库、模板库与案例库。", "integrationType": "vector_rag", "dependsOn": ["research", "drafting"], "apiKey": "", "endpoint": "./chroma_lexhub", "enabled": True},
    ],
    "mcpTools": [],
    "routingRules": [],
    "reviewRules": [],
}


def _normalize_model_provider(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(item.get("id") or "").strip(),
        "label": str(item.get("label") or item.get("id") or "").strip(),
        "presetId": str(item.get("presetId") or "custom").strip(),
        "protocol": "openai_compatible",
        "baseUrl": str(item.get("baseUrl") or "").strip(),
        "apiKey": str(item.get("apiKey") or "").strip(),
        "enabled": bool(item.get("enabled", False)),
        "local": bool(item.get("local", False)),
    }


def _normalize_model_slot(item: dict[str, Any]) -> dict[str, Any] | None:
    slot_id = str(item.get("id") or "").strip()
    if slot_id not in {"language", "vision"}:
        return None
    return {
        "id": slot_id,
        "label": str(item.get("label") or ("主语言模型" if slot_id == "language" else "视觉理解模型")).strip(),
        "description": str(item.get("description") or "").strip(),
        "providerId": str(item.get("providerId") or "").strip(),
        "modelName": str(item.get("modelName") or "").strip(),
        "enabled": bool(item.get("enabled", True)),
        "capabilities": list(item.get("capabilities") or (["text", "reasoning"] if slot_id == "language" else ["vision", "document"])),
    }


def _infer_provider_id(item: dict[str, Any], slot_id: str) -> str:
    hint = f"{item.get('providerId', '')} {item.get('baseUrl', '')}".lower()
    for provider_id, markers in {
        "deepseek": ("deepseek",),
        "qwen": ("dashscope", "qwen"),
        "zhipu": ("open.bigmodel", "zhipu", "glm"),
        "moonshot": ("moonshot", "kimi"),
        "openai": ("openai.com", "gpt"),
        "ollama": ("11434", "ollama"),
    }.items():
        if any(marker in hint for marker in markers):
            return provider_id
    return f"legacy-{slot_id}"


def _migrate_legacy_models(settings: dict[str, Any]) -> None:
    if settings.get("modelProviders") and settings.get("modelSlots"):
        return
    providers = deepcopy(DEFAULT_SETTINGS["modelProviders"])
    slots = deepcopy(DEFAULT_SETTINGS["modelSlots"])
    legacy = settings.get("models") or []
    language = next((item for item in legacy if item.get("id") == "planner" and item.get("modelName")), None)
    if not language:
        language = next((item for item in legacy if item.get("capabilityType") == "text_llm" and item.get("modelName")), None)
    vision = next((item for item in legacy if item.get("id") == "vision" and item.get("modelName")), None)

    for slot_id, model in (("language", language), ("vision", vision)):
        if not model:
            continue
        provider_id = _infer_provider_id(model, slot_id)
        provider = next((item for item in providers if item["id"] == provider_id), None)
        migrated_provider = {
            "id": provider_id,
            "label": (provider or {}).get("label") or model.get("label") or provider_id,
            "presetId": (provider or {}).get("presetId") or "custom",
            "protocol": "openai_compatible",
            "baseUrl": str(model.get("baseUrl") or (provider or {}).get("baseUrl") or "").strip(),
            "apiKey": str(model.get("apiKey") or (provider or {}).get("apiKey") or "").strip(),
            "enabled": bool(model.get("enabled", True)),
            "local": bool((provider or {}).get("local", False)),
        }
        if provider:
            provider.update(migrated_provider)
        else:
            providers.append(migrated_provider)
        slot = next(item for item in slots if item["id"] == slot_id)
        slot.update({
            "providerId": provider_id,
            "modelName": str(model.get("modelName") or "").strip(),
            "enabled": bool(model.get("enabled", True)),
        })

    settings["modelProviders"] = providers
    settings["modelSlots"] = slots


def _ensure_runtime_dir() -> None:
    os.makedirs(_RUNTIME_DIR, exist_ok=True)


def _merge_default_providers(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep saved provider settings while making newly shipped presets discoverable."""
    saved_by_id = {
        str(item.get("id") or ""): item
        for item in items
        if isinstance(item, dict) and item.get("id")
    }
    merged = []
    for default in DEFAULT_SETTINGS["modelProviders"]:
        current = saved_by_id.pop(str(default["id"]), None)
        merged.append(_normalize_model_provider(current or default))
    merged.extend(_normalize_model_provider(item) for item in saved_by_id.values())
    return merged


def _mask_secret(value: str | None) -> str:
    if not value:
        return ""
    text = str(value)
    if len(text) <= 8:
        return "****"
    return f"{text[:4]}****{text[-4:]}"


def _is_masked_secret(value: Any) -> bool:
    text = str(value or "").strip()
    return bool(text) and (set(text) == {"*"} or "****" in text)


def _preserve_masked_secrets(
    incoming_items: list[dict[str, Any]],
    current_items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    current_by_id = {
        str(item.get("id") or ""): item
        for item in current_items
        if isinstance(item, dict) and item.get("id")
    }
    merged: list[dict[str, Any]] = []
    for item in incoming_items:
        if not isinstance(item, dict):
            continue
        copied = deepcopy(item)
        current = current_by_id.get(str(copied.get("id") or ""))
        if current and _is_masked_secret(copied.get("apiKey")):
            copied["apiKey"] = current.get("apiKey", "")
        merged.append(copied)
    return merged


def _normalize_model_entry(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(item.get("id") or "").strip(),
        "providerId": str(item.get("providerId") or "").strip(),
        "label": str(item.get("label") or "").strip(),
        "agentName": str(item.get("agentName") or "").strip(),
        "description": str(item.get("description") or "").strip(),
        "capabilityType": str(item.get("capabilityType") or "text_llm").strip(),
        "capabilities": list(item.get("capabilities") or []),
        "modelName": str(item.get("modelName") or "").strip(),
        "apiKey": str(item.get("apiKey") or "").strip(),
        "baseUrl": str(item.get("baseUrl") or "").strip(),
        "enabled": bool(item.get("enabled", True)),
        "ocrFormats": item.get("ocrFormats"),
        "infraNote": item.get("infraNote"),
    }


def _normalize_api_entry(item: dict[str, Any]) -> dict[str, Any]:
    api_id = str(item.get("id") or "").strip()
    endpoint = str(item.get("endpoint") or "").strip()
    if api_id == "web_search" and not endpoint:
        endpoint = "https://api.tavily.com/search"
    return {
        "id": api_id,
        "providerId": str(item.get("providerId") or "").strip(),
        "name": str(item.get("name") or "").strip(),
        "category": str(item.get("category") or "").strip(),
        "purpose": str(item.get("purpose") or "").strip(),
        "integrationType": str(item.get("integrationType") or "rest_api").strip(),
        "dependsOn": list(item.get("dependsOn") or []),
        "apiKey": str(item.get("apiKey") or "").strip(),
        "endpoint": endpoint,
        "enabled": bool(item.get("enabled", False)),
    }


def _merge_default_apis(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep the core runtime services stable while retaining user-registered services."""
    saved_by_id = {
        str(item.get("id") or ""): item
        for item in items
        if isinstance(item, dict) and item.get("id")
    }
    merged: list[dict[str, Any]] = []
    for default in DEFAULT_SETTINGS["apis"]:
        current = saved_by_id.pop(str(default["id"]), None)
        merged.append(_normalize_api_entry(current or default))
    merged.extend(_normalize_api_entry(item) for item in saved_by_id.values())
    return merged


def _hydrate_environment_apis(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Reflect .env credentials in the admin UI without exposing their values."""
    hydrated = deepcopy(items)
    by_id = {str(item.get("id") or ""): item for item in hydrated}

    tavily = by_id.get("web_search")
    if tavily is not None and os.environ.get("TAVILY_API_KEY", "").strip():
        tavily.update({"providerId": "tavily", "enabled": True, "apiKey": "********"})
        tavily["endpoint"] = tavily.get("endpoint") or "https://api.tavily.com/search"

    ocr = by_id.get("ocr")
    if ocr is not None and os.environ.get("BAIDU_OCR_API_KEY", "").strip() and os.environ.get("BAIDU_OCR_SECRET_KEY", "").strip():
        ocr.update({"providerId": "baidu-ocr", "enabled": True, "apiKey": "********"})
        ocr["endpoint"] = os.environ.get("BAIDU_OCR_ENDPOINT", "").strip() or ocr.get("endpoint")

    legal = by_id.get("legal_search")
    if legal is not None and (os.environ.get("DELILEGAL_APPID", "").strip() or os.environ.get("LEGAL_SEARCH_API_KEY", "").strip()):
        legal.update({"providerId": "delilegal", "enabled": True, "apiKey": "********"})
        legal["endpoint"] = os.environ.get("DELILEGAL_BASE_URL", "").strip() or legal.get("endpoint")

    return hydrated


def _hydrate_environment_models(response: dict[str, Any]) -> None:
    """Expose the two effective runtime model slots through the unified admin view."""
    providers = response.get("modelProviders") or []
    slots = response.get("modelSlots") or []
    providers_by_id = {str(item.get("id") or ""): item for item in providers}
    env_by_slot = {
        "language": ("API_KEY", "API_BASE_URL", "MODEL_NAME"),
        "vision": ("VISION_API_KEY", "VISION_API_BASE_URL", "VISION_MODEL_NAME"),
    }
    for slot in slots:
        env_names = env_by_slot.get(str(slot.get("id") or ""))
        if not env_names:
            continue
        api_key, base_url, model_name = (os.environ.get(name, "").strip() for name in env_names)
        if not (api_key and base_url and model_name):
            continue
        provider = providers_by_id.get(str(slot.get("providerId") or ""))
        if provider is None:
            continue
        provider.update({"enabled": True, "baseUrl": base_url, "apiKey": "********"})
        slot.update({"enabled": True, "modelName": model_name})


def _normalize_mcp_entry(item: dict[str, Any]) -> dict[str, Any] | None:
    skill_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", str(item.get("skill_name") or "").strip())
    if not skill_name:
        return None
    mcp_cfg = item.get("mcp_server_config") or {}
    command = str(mcp_cfg.get("command") or "").strip()
    args = [str(arg).strip() for arg in (mcp_cfg.get("args") or []) if str(arg).strip()]
    if not command:
        return None
    source_code = str(item.get("source_code") or "")
    entry_file = str(item.get("entry_file") or f"{skill_name}.py").strip()
    return {
        "skill_name": skill_name,
        "skill_type": "local_mcp",
        "enabled": bool(item.get("enabled", True)),
        "authorizedAgents": [
            str(agent_id).strip()
            for agent_id in (item.get("authorizedAgents") or [])
            if str(agent_id).strip()
        ],
        "display_name_zh": str(item.get("display_name_zh") or skill_name).strip(),
        "display_name_en": str(item.get("display_name_en") or skill_name).strip(),
        "description_zh": str(item.get("description_zh") or "管理端注册的 MCP 工具").strip(),
        "description_en": str(item.get("description_en") or "Admin registered MCP tool").strip(),
        "source_code": source_code,
        "entry_file": entry_file,
        "mcp_server_config": {
            "command": command,
            "args": args,
        },
    }


def _materialize_custom_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Write admin-authored MCP sources to a runtime-only directory and wire their launch config."""
    os.makedirs(_CUSTOM_TOOL_SOURCE_DIR, exist_ok=True)
    materialized: list[dict[str, Any]] = []
    for raw in tools:
        item = deepcopy(raw)
        source_code = str(item.get("source_code") or "")
        if source_code.strip():
            skill_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", str(item.get("skill_name") or "custom_tool"))
            filename = f"{skill_name}.py"
            target = os.path.abspath(os.path.join(_CUSTOM_TOOL_SOURCE_DIR, filename))
            if os.path.commonpath([target, os.path.abspath(_CUSTOM_TOOL_SOURCE_DIR)]) != os.path.abspath(_CUSTOM_TOOL_SOURCE_DIR):
                raise ValueError("invalid custom tool path")
            with open(target, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(source_code.rstrip() + "\n")
            item["entry_file"] = os.path.relpath(target, _RUNTIME_DIR).replace("\\", "/")
            item["mcp_server_config"] = {"command": "python", "args": [target]}
        materialized.append(item)
    return materialized


def load_admin_settings() -> dict[str, Any]:
    _ensure_runtime_dir()
    if not os.path.isfile(_SETTINGS_PATH):
        return deepcopy(DEFAULT_SETTINGS)
    try:
        with open(_SETTINGS_PATH, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if not isinstance(payload, dict):
            return deepcopy(DEFAULT_SETTINGS)
        merged = deepcopy(DEFAULT_SETTINGS)
        merged.update(payload)
        merged["modelProviders"] = _merge_default_providers([
            _normalize_model_provider(item)
            for item in (payload.get("modelProviders") or [])
            if isinstance(item, dict) and item.get("id")
        ])
        merged["modelSlots"] = [
            normalized
            for item in (payload.get("modelSlots") or [])
            if isinstance(item, dict)
            for normalized in [_normalize_model_slot(item)]
            if normalized
        ]
        merged["models"] = [_normalize_model_entry(item) for item in (payload.get("models") or []) if isinstance(item, dict)]
        merged["apis"] = _merge_default_apis([
            _normalize_api_entry(item)
            for item in (payload.get("apis") or [])
            if isinstance(item, dict) and item.get("id")
        ])
        merged["mcpTools"] = [
            normalized
            for item in (payload.get("mcpTools") or [])
            if isinstance(item, dict)
            for normalized in [_normalize_mcp_entry(item)]
            if normalized
        ]
        _migrate_legacy_models(merged)
        merged["version"] = 2
        return merged
    except Exception as exc:
        logger.warning("load admin settings failed: %s", exc)
        return deepcopy(DEFAULT_SETTINGS)


def save_admin_settings(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_runtime_dir()
    current = load_admin_settings()
    incoming = payload if isinstance(payload, dict) else {}

    next_settings = deepcopy(current)
    if "modelProviders" in incoming:
        next_settings["modelProviders"] = _merge_default_providers([
            _normalize_model_provider(item)
            for item in _preserve_masked_secrets(incoming.get("modelProviders") or [], current.get("modelProviders") or [])
            if isinstance(item, dict) and item.get("id")
        ])
    if "modelSlots" in incoming:
        next_settings["modelSlots"] = [
            normalized
            for item in (incoming.get("modelSlots") or [])
            if isinstance(item, dict)
            for normalized in [_normalize_model_slot(item)]
            if normalized
        ]
    if "models" in incoming:
        next_settings["models"] = [
            _normalize_model_entry(item)
            for item in _preserve_masked_secrets(incoming.get("models") or [], current.get("models") or [])
            if isinstance(item, dict) and item.get("id")
        ]
    if "apis" in incoming:
        next_settings["apis"] = _merge_default_apis([
            _normalize_api_entry(item)
            for item in _preserve_masked_secrets(incoming.get("apis") or [], current.get("apis") or [])
            if isinstance(item, dict) and item.get("id")
        ])
    if "mcpTools" in incoming:
        next_settings["mcpTools"] = _materialize_custom_tools([
            normalized
            for item in (incoming.get("mcpTools") or [])
            if isinstance(item, dict)
            for normalized in [_normalize_mcp_entry(item)]
            if normalized
        ])
    if "routingRules" in incoming and isinstance(incoming.get("routingRules"), list):
        next_settings["routingRules"] = [str(item) for item in incoming["routingRules"]]
    if "reviewRules" in incoming and isinstance(incoming.get("reviewRules"), list):
        next_settings["reviewRules"] = [str(item) for item in incoming["reviewRules"]]

    _migrate_legacy_models(next_settings)
    next_settings["version"] = 2
    next_settings["updatedAt"] = datetime.now(timezone.utc).isoformat()

    with open(_SETTINGS_PATH, "w", encoding="utf-8") as handle:
        json.dump(next_settings, handle, ensure_ascii=False, indent=2)

    custom_mcp = next_settings.get("mcpTools") or []
    with open(_CUSTOM_MCP_PATH, "w", encoding="utf-8") as handle:
        json.dump(custom_mcp, handle, ensure_ascii=False, indent=2)

    apply_admin_runtime_config(next_settings)
    logger.info("admin runtime settings saved: models=%s apis=%s mcp=%s",
                len(next_settings.get("models") or []),
                len(next_settings.get("apis") or []),
                len(custom_mcp))
    return next_settings


def _set_env_if_value(key: str, value: str | None) -> None:
    if value is None:
        return
    text = str(value).strip()
    if text:
        os.environ[key] = text


def _apply_model_overlay(models: list[dict[str, Any]]) -> int:
    applied = 0
    for item in models:
        if not item.get("enabled"):
            continue
        model_name = str(item.get("modelName") or "").strip()
        api_key = str(item.get("apiKey") or "").strip()
        base_url = str(item.get("baseUrl") or "").strip()
        if not (model_name and api_key and base_url):
            continue
        prefix = MODEL_ROLE_PREFIX.get(str(item.get("id") or ""))
        if not prefix:
            continue
        _set_env_if_value(f"{prefix}_API_KEY", api_key)
        _set_env_if_value(f"{prefix}_API_BASE_URL", base_url)
        _set_env_if_value(f"{prefix}_MODEL_NAME", model_name)
        applied += 1
        if str(item.get("id")) == "planner":
            _set_env_if_value("API_KEY", api_key)
            _set_env_if_value("API_BASE_URL", base_url)
            _set_env_if_value("MODEL_NAME", model_name)
            os.environ["OPENAI_API_KEY"] = api_key
    return applied


def _apply_system_model_overlay(
    providers: list[dict[str, Any]],
    slots: list[dict[str, Any]],
) -> int:
    providers_by_id = {
        str(item.get("id") or ""): item
        for item in providers
        if isinstance(item, dict) and item.get("id")
    }
    applied = 0
    for slot in slots:
        if not slot.get("enabled"):
            continue
        slot_id = str(slot.get("id") or "")
        provider = providers_by_id.get(str(slot.get("providerId") or ""))
        if not provider or not provider.get("enabled"):
            continue
        model_name = str(slot.get("modelName") or "").strip()
        api_key = str(provider.get("apiKey") or "").strip()
        base_url = str(provider.get("baseUrl") or "").strip()
        is_local = bool(provider.get("local"))
        if not (model_name and base_url and (api_key or is_local)):
            continue
        effective_key = api_key or "ollama-local"

        if slot_id == "language":
            for prefix in ("PLAN", "ACT", "TOOL", "CREDIBILITY"):
                _set_env_if_value(f"{prefix}_API_KEY", effective_key)
                _set_env_if_value(f"{prefix}_API_BASE_URL", base_url)
                _set_env_if_value(f"{prefix}_MODEL_NAME", model_name)
            _set_env_if_value("API_KEY", effective_key)
            _set_env_if_value("API_BASE_URL", base_url)
            _set_env_if_value("MODEL_NAME", model_name)
            os.environ["OPENAI_API_KEY"] = effective_key
            applied += 1
        elif slot_id == "vision":
            _set_env_if_value("VISION_API_KEY", effective_key)
            _set_env_if_value("VISION_API_BASE_URL", base_url)
            _set_env_if_value("VISION_MODEL_NAME", model_name)
            applied += 1
    return applied


def _apply_api_overlay(apis: list[dict[str, Any]]) -> int:
    applied = 0
    for item in apis:
        if not item.get("enabled"):
            continue
        api_id = str(item.get("id") or "")
        api_key = str(item.get("apiKey") or "").strip()
        endpoint = str(item.get("endpoint") or "").strip()

        if api_id == "web_search" and api_key:
            _set_env_if_value("TAVILY_API_KEY", api_key)
            applied += 1
        elif api_id == "legal_search":
            if "|" in api_key:
                appid, secret = api_key.split("|", 1)
                _set_env_if_value("DELILEGAL_APPID", appid.strip())
                _set_env_if_value("DELILEGAL_SECRET", secret.strip())
                applied += 1
            elif api_key:
                _set_env_if_value("DELILEGAL_APPID", api_key)
                applied += 1
            if endpoint:
                _set_env_if_value("DELILEGAL_BASE_URL", endpoint.rstrip("/"))
                applied += 1
        elif api_id == "vector_rag" and endpoint:
            _set_env_if_value("CHROMA_PERSIST_DIR", endpoint)
            applied += 1
        elif api_id == "ocr":
            if "|" in api_key:
                baidu_key, baidu_secret = api_key.split("|", 1)
                _set_env_if_value("BAIDU_OCR_API_KEY", baidu_key.strip())
                _set_env_if_value("BAIDU_OCR_SECRET_KEY", baidu_secret.strip())
                applied += 1
            elif api_key:
                _set_env_if_value("BAIDU_OCR_API_KEY", api_key)
                applied += 1
            if endpoint:
                if "aip.baidubce.com" in endpoint:
                    _set_env_if_value("BAIDU_OCR_ENDPOINT", endpoint)
                else:
                    _set_env_if_value("PADDLE_OCR_ENDPOINT", endpoint)
                applied += 1
        elif api_id == "export" and endpoint:
            _set_env_if_value("DOCX_EXPORT_BASE_URL", endpoint)
            applied += 1
        elif api_id == "contract_review_external":
            if "|" in api_key:
                baidu_key, baidu_secret = api_key.split("|", 1)
                _set_env_if_value("BAIDU_TEXTREVIEW_API_KEY", baidu_key.strip())
                _set_env_if_value("BAIDU_TEXTREVIEW_SECRET_KEY", baidu_secret.strip())
                applied += 1
            elif api_key:
                _set_env_if_value("BAIDU_TEXTREVIEW_API_KEY", api_key)
                applied += 1
    return applied


def is_api_enabled(api_id: str, settings: dict[str, Any] | None = None) -> bool:
    payload = settings or load_admin_settings()
    for item in payload.get("apis") or []:
        if str(item.get("id") or "") == api_id:
            return bool(item.get("enabled", True))
    return True


def apply_admin_runtime_config(settings: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = settings or load_admin_settings()
    models_applied = _apply_system_model_overlay(
        payload.get("modelProviders") or [],
        payload.get("modelSlots") or [],
    )
    if models_applied == 0:
        models_applied = _apply_model_overlay(payload.get("models") or [])
    apis_applied = _apply_api_overlay(payload.get("apis") or [])
    return {
        "modelsApplied": models_applied,
        "apisApplied": apis_applied,
        "mcpToolCount": len(payload.get("mcpTools") or []),
        "updatedAt": payload.get("updatedAt"),
    }


def load_custom_mcp_tools() -> list[dict[str, Any]]:
    _ensure_runtime_dir()
    if os.path.isfile(_CUSTOM_MCP_PATH):
        try:
            with open(_CUSTOM_MCP_PATH, "r", encoding="utf-8") as handle:
                raw = json.load(handle)
            if isinstance(raw, list):
                return [
                    normalized
                    for item in raw
                    if isinstance(item, dict)
                    for normalized in [_normalize_mcp_entry(item)]
                    if normalized and normalized.get("enabled", True)
                ]
        except Exception as exc:
            logger.warning("load custom mcp tools failed: %s", exc)
    settings = load_admin_settings()
    return [item for item in (settings.get("mcpTools") or []) if item.get("enabled", True)]


def build_admin_settings_response(include_secrets: bool = True) -> dict[str, Any]:
    settings = load_admin_settings()
    apply_info = apply_admin_runtime_config(settings)
    response = deepcopy(settings)
    _hydrate_environment_models(response)
    response["apis"] = _hydrate_environment_apis(response.get("apis") or [])
    if not include_secrets:
        for item in response.get("modelProviders") or []:
            item["apiKey"] = _mask_secret(item.get("apiKey"))
        for item in response.get("models") or []:
            item["apiKey"] = _mask_secret(item.get("apiKey"))
        for item in response.get("apis") or []:
            item["apiKey"] = _mask_secret(item.get("apiKey"))
    response["runtime"] = {
        **apply_info,
        "settingsPath": _SETTINGS_PATH,
        "customMcpPath": _CUSTOM_MCP_PATH,
        "effective": apply_info["modelsApplied"] > 0 or apply_info["apisApplied"] > 0,
    }
    return response


def _test_single_model(label: str, config: dict[str, Any]) -> dict[str, Any]:
    model = str(config.get("model") or "").strip()
    api_key = str(config.get("api_key") or "").strip()
    base_url = str(config.get("base_url") or "").strip()
    if not (model and api_key and base_url):
        return {"label": label, "ok": False, "detail": "模型/API 地址/Key 未配置完整"}

    try:
        from llm import set_model

        llm = set_model(config)
        reply = llm.chat_to_llm(
            [{"role": "user", "content": "只回复 OK，不要其它内容。"}],
            max_tokens=16,
        )
        snippet = str(reply or "").strip().replace("\n", " ")[:80]
        return {
            "label": label,
            "ok": bool(snippet),
            "detail": f"{model} @ {base_url} → {snippet or '空响应'}",
        }
    except Exception as exc:
        return {"label": label, "ok": False, "detail": f"{model} 调用失败: {exc}"}


def _test_api_item(api_id: str, name: str) -> dict[str, Any]:
    try:
        if api_id == "web_search":
            key = os.environ.get("TAVILY_API_KEY", "").strip()
            if not key:
                return {"id": api_id, "label": name, "ok": False, "detail": "TAVILY_API_KEY 未设置"}
            return {"id": api_id, "label": name, "ok": True, "detail": "Tavily Key 已生效"}

        if api_id == "legal_search":
            from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search

            result = hybrid_legal_search("民法典 合同", limit=1)
            sources = result.get("sources") or []
            count = len(result.get("laws") or []) + len(result.get("local") or [])
            return {
                "id": api_id,
                "label": name,
                "ok": count > 0 or bool(sources),
                "detail": f"来源 {sources or ['无']}，命中 {count} 条",
            }

        if api_id == "vector_rag":
            from cosight_server.deep_research.services.legal_kb.vector_store import get_vector_store

            stats = get_vector_store().stats()
            if not stats.get("available"):
                return {"id": api_id, "label": name, "ok": False, "detail": "Chroma 不可用"}
            return {
                "id": api_id,
                "label": name,
                "ok": True,
                "detail": f"法条 {stats.get('statutes', 0)} · 模板 {stats.get('templates', 0)}",
            }

        if api_id == "ocr":
            endpoint = os.environ.get("PADDLE_OCR_ENDPOINT", "").strip()
            if endpoint:
                return {"id": api_id, "label": name, "ok": True, "detail": f"OCR Endpoint: {endpoint}"}
            baidu_key = os.environ.get("BAIDU_OCR_API_KEY", "").strip()
            baidu_secret = os.environ.get("BAIDU_OCR_SECRET_KEY", "").strip()
            if baidu_key and baidu_secret:
                from cosight_server.deep_research.services.baidu_ocr import BaiduOcrClient

                client = BaiduOcrClient()
                client._get_access_token()
                return {"id": api_id, "label": name, "ok": True, "detail": "百度 OCR 鉴权成功"}
            if baidu_key:
                return {"id": api_id, "label": name, "ok": False, "detail": "百度 OCR Secret Key 未配置"}
            return {"id": api_id, "label": name, "ok": False, "detail": "OCR 服务未配置"}

        return {"id": api_id, "label": name, "ok": True, "detail": "已登记（无自动探针）"}
    except Exception as exc:
        return {"id": api_id, "label": name, "ok": False, "detail": str(exc)}


def _test_mcp_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    import shutil

    results: list[dict[str, Any]] = []
    for item in tools:
        if not item.get("enabled", True):
            continue
        command = str((item.get("mcp_server_config") or {}).get("command") or "").strip()
        skill_name = str(item.get("skill_name") or "").strip()
        source_code = str(item.get("source_code") or "")
        if source_code.strip():
            try:
                compile(source_code, f"<{skill_name or 'custom_tool'}>", "exec")
                results.append({"skill_name": skill_name, "ok": True, "detail": "Python 模板语法检查通过，保存后将注册为 MCP 工具"})
            except SyntaxError as exc:
                results.append({"skill_name": skill_name, "ok": False, "detail": f"Python 语法错误：第 {exc.lineno} 行 {exc.msg}"})
            continue
        if not command:
            results.append({"skill_name": skill_name, "ok": False, "detail": "command 为空"})
            continue
        resolved = shutil.which(command)
        results.append({
            "skill_name": skill_name,
            "ok": bool(resolved),
            "detail": f"command={command} {'可执行' if resolved else '未找到'}",
        })
    return results


def test_admin_runtime_config(settings: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = settings or load_admin_settings()
    apply_admin_runtime_config(payload)

    from config.config import (
        get_act_model_config,
        get_credibility_model_config,
        get_model_config,
        get_plan_model_config,
        get_tool_model_config,
        get_vision_model_config,
    )

    model_tests = [
        ("planner", "任务理解模型", get_plan_model_config),
        ("research", "法规研究模型", get_act_model_config),
        ("drafting", "文书生成模型", get_tool_model_config),
        ("vision", "视觉/OCR 模型", get_vision_model_config),
        ("review", "交叉审查模型", get_credibility_model_config),
    ]
    enabled_ids = {
        str(item.get("id"))
        for item in (payload.get("models") or [])
        if item.get("enabled") and str(item.get("modelName") or "").strip()
    }

    providers_by_id = {
        str(item.get("id") or ""): item
        for item in (payload.get("modelProviders") or [])
        if isinstance(item, dict)
    }
    slot_targets = []
    for slot in payload.get("modelSlots") or []:
        provider = providers_by_id.get(str(slot.get("providerId") or ""))
        if not slot.get("enabled") or not provider or not provider.get("enabled"):
            continue
        complete = bool(
            str(slot.get("modelName") or "").strip()
            and str(provider.get("baseUrl") or "").strip()
            and (str(provider.get("apiKey") or "").strip() or provider.get("local"))
        )
        if not complete:
            continue
        if slot.get("id") == "language":
            slot_targets.append(("language", "主语言模型", get_model_config))
        elif slot.get("id") == "vision":
            slot_targets.append(("vision", "视觉理解模型", get_vision_model_config))

    model_results: list[dict[str, Any]] = []
    ping_targets = slot_targets or [row for row in model_tests if row[0] in enabled_ids]
    if not ping_targets:
        ping_targets = [model_tests[0]]

    for _, label, config_fn in ping_targets[:2]:
        model_results.append(_test_single_model(label, config_fn()))

    api_results: list[dict[str, Any]] = []
    for item in payload.get("apis") or []:
        if not item.get("enabled"):
            continue
        api_results.append(_test_api_item(str(item.get("id") or ""), str(item.get("name") or item.get("id") or "API")))

    mcp_results = _test_mcp_tools(payload.get("mcpTools") or [])

    checks = [row["ok"] for row in model_results + api_results + mcp_results]
    return {
        "allOk": all(checks) if checks else False,
        "models": model_results,
        "apis": api_results,
        "mcpTools": mcp_results,
        "summary": {
            "modelPass": sum(1 for row in model_results if row["ok"]),
            "modelTotal": len(model_results),
            "apiPass": sum(1 for row in api_results if row["ok"]),
            "apiTotal": len(api_results),
            "mcpPass": sum(1 for row in mcp_results if row["ok"]),
            "mcpTotal": len(mcp_results),
        },
    }
