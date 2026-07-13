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

MODEL_ROLE_PREFIX = {
    "planner": "PLAN",
    "vision": "VISION",
    "research": "ACT",
    "drafting": "TOOL",
    "review": "CREDIBILITY",
}

DEFAULT_SETTINGS: dict[str, Any] = {
    "version": 1,
    "updatedAt": None,
    "models": [],
    "apis": [],
    "mcpTools": [],
    "routingRules": [],
    "reviewRules": [],
}


def _ensure_runtime_dir() -> None:
    os.makedirs(_RUNTIME_DIR, exist_ok=True)


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
    return {
        "id": str(item.get("id") or "").strip(),
        "providerId": str(item.get("providerId") or "").strip(),
        "name": str(item.get("name") or "").strip(),
        "category": str(item.get("category") or "").strip(),
        "purpose": str(item.get("purpose") or "").strip(),
        "integrationType": str(item.get("integrationType") or "rest_api").strip(),
        "dependsOn": list(item.get("dependsOn") or []),
        "apiKey": str(item.get("apiKey") or "").strip(),
        "endpoint": str(item.get("endpoint") or "").strip(),
        "enabled": bool(item.get("enabled", False)),
    }


def _normalize_mcp_entry(item: dict[str, Any]) -> dict[str, Any] | None:
    skill_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", str(item.get("skill_name") or "").strip())
    if not skill_name:
        return None
    mcp_cfg = item.get("mcp_server_config") or {}
    command = str(mcp_cfg.get("command") or "").strip()
    args = [str(arg).strip() for arg in (mcp_cfg.get("args") or []) if str(arg).strip()]
    if not command:
        return None
    return {
        "skill_name": skill_name,
        "skill_type": "local_mcp",
        "display_name_zh": str(item.get("display_name_zh") or skill_name).strip(),
        "display_name_en": str(item.get("display_name_en") or skill_name).strip(),
        "description_zh": str(item.get("description_zh") or "管理端注册的 MCP 工具").strip(),
        "description_en": str(item.get("description_en") or "Admin registered MCP tool").strip(),
        "mcp_server_config": {
            "command": command,
            "args": args,
        },
    }


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
        merged["models"] = [_normalize_model_entry(item) for item in (payload.get("models") or []) if isinstance(item, dict)]
        merged["apis"] = [_normalize_api_entry(item) for item in (payload.get("apis") or []) if isinstance(item, dict)]
        merged["mcpTools"] = [
            normalized
            for item in (payload.get("mcpTools") or [])
            if isinstance(item, dict)
            for normalized in [_normalize_mcp_entry(item)]
            if normalized
        ]
        return merged
    except Exception as exc:
        logger.warning("load admin settings failed: %s", exc)
        return deepcopy(DEFAULT_SETTINGS)


def save_admin_settings(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_runtime_dir()
    current = load_admin_settings()
    incoming = payload if isinstance(payload, dict) else {}

    next_settings = deepcopy(current)
    if "models" in incoming:
        next_settings["models"] = [
            _normalize_model_entry(item)
            for item in _preserve_masked_secrets(incoming.get("models") or [], current.get("models") or [])
            if isinstance(item, dict) and item.get("id")
        ]
    if "apis" in incoming:
        next_settings["apis"] = [
            _normalize_api_entry(item)
            for item in _preserve_masked_secrets(incoming.get("apis") or [], current.get("apis") or [])
            if isinstance(item, dict) and item.get("id")
        ]
    if "mcpTools" in incoming:
        next_settings["mcpTools"] = [
            normalized
            for item in (incoming.get("mcpTools") or [])
            if isinstance(item, dict)
            for normalized in [_normalize_mcp_entry(item)]
            if normalized
        ]
    if "routingRules" in incoming and isinstance(incoming.get("routingRules"), list):
        next_settings["routingRules"] = [str(item) for item in incoming["routingRules"]]
    if "reviewRules" in incoming and isinstance(incoming.get("reviewRules"), list):
        next_settings["reviewRules"] = [str(item) for item in incoming["reviewRules"]]

    next_settings["version"] = 1
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
                    if normalized
                ]
        except Exception as exc:
            logger.warning("load custom mcp tools failed: %s", exc)
    settings = load_admin_settings()
    return list(settings.get("mcpTools") or [])


def build_admin_settings_response(include_secrets: bool = True) -> dict[str, Any]:
    settings = load_admin_settings()
    apply_info = apply_admin_runtime_config(settings)
    response = deepcopy(settings)
    if not include_secrets:
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
            return {"id": api_id, "label": name, "ok": False, "detail": "OCR Endpoint 未配置"}

        return {"id": api_id, "label": name, "ok": True, "detail": "已登记（无自动探针）"}
    except Exception as exc:
        return {"id": api_id, "label": name, "ok": False, "detail": str(exc)}


def _test_mcp_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    import shutil

    results: list[dict[str, Any]] = []
    for item in tools:
        command = str((item.get("mcp_server_config") or {}).get("command") or "").strip()
        skill_name = str(item.get("skill_name") or "").strip()
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

    model_results: list[dict[str, Any]] = []
    ping_targets = [row for row in model_tests if row[0] in enabled_ids]
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
