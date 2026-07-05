"""幂简集成 · 商业合同生成（Explinks）。"""

from __future__ import annotations

import json
import os
import time
from typing import Any

import requests

from app.common.logger_util import logger


def _clean(value: Any) -> str:
    return ("" if value is None else str(value)).strip().strip("`").strip()


def _join_url(base: str, path: str) -> str:
    b = _clean(base)
    p = _clean(path)
    if not b or not p:
        return ""
    if b.endswith("/") and p.startswith("/"):
        return b[:-1] + p
    if (not b.endswith("/")) and (not p.startswith("/")):
        return b + "/" + p
    return b + p


def _normalize_widget_data(data: Any) -> dict[str, Any]:
    if isinstance(data, str):
        text = data.strip()
        if not text:
            return {}
        try:
            parsed = json.loads(text)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    if isinstance(data, dict):
        if any(key in data for key in ("basic_form_data", "party_form_data", "clauses_form_data")):
            return data
        for key in ("Content", "content", "Output", "output"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:
                    continue
            if isinstance(value, dict):
                if any(k in value for k in ("basic_form_data", "party_form_data", "clauses_form_data")):
                    return value
                nested = value.get("Content") or value.get("content")
                if isinstance(nested, str) and nested.strip():
                    try:
                        parsed = json.loads(nested)
                        if isinstance(parsed, dict):
                            return parsed
                    except Exception:
                        continue
        return data
    return {}


def _extract_contract_payload_from_gateway(obj: dict[str, Any]) -> dict[str, Any]:
    response_data = obj.get("responseData")
    if isinstance(response_data, dict):
        return response_data

    response_content = obj.get("responseContent")
    if isinstance(response_content, str) and response_content.strip():
        try:
            parsed = json.loads(response_content.strip())
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {}

    body = obj.get("body")
    if isinstance(body, dict):
        return body
    return {}


class ExplinksContractClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        api_key: str | None = None,
        contract_path: str | None = None,
        language: str | None = None,
        timeout: int | None = None,
        retries: int | None = None,
    ):
        self.base_url = (
            base_url
            or os.environ.get("EXPLINKS_BASE_URL")
            or "https://openapi.explinks.com/81034818417/2a48235172e8420ca283288b6340f3a7"
        ).strip()
        self.api_key = (api_key or os.environ.get("EXPLINKS_API_KEY") or "").strip()
        self.contract_path = (
            contract_path
            or os.environ.get("EXPLINKS_CONTRACT_PATH")
            or "/v1/prompt_writing_commer_contract"
        ).strip()
        self.language = (language or os.environ.get("EXPLINKS_LANGUAGE") or "中文").strip()
        self.timeout = int(timeout or os.environ.get("EXPLINKS_TIMEOUT") or 60)
        self.retries = int(retries or os.environ.get("EXPLINKS_RETRIES") or 2)

    @property
    def enabled(self) -> bool:
        return bool(self.base_url and self.api_key)

    @property
    def request_url(self) -> str:
        return _join_url(self.base_url, self.contract_path)

    def generate(
        self,
        *,
        contract_type: str = "",
        party_a: str = "",
        party_b: str = "",
        key_clauses: str = "",
        language: str | None = None,
        form_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = self.request_url
        if not url:
            return self._error("缺少 EXPLINKS_BASE_URL / EXPLINKS_CONTRACT_PATH")
        if not self.api_key:
            return self._error("缺少 EXPLINKS_API_KEY")

        data = _normalize_widget_data(form_data or {})
        if not contract_type:
            contract_type = _clean((data.get("basic_form_data") or {}).get("contractType"))
        if not party_a:
            party_a = _clean((data.get("party_form_data") or {}).get("partyA"))
        if not party_b:
            party_b = _clean((data.get("party_form_data") or {}).get("partyB"))
        if not key_clauses:
            key_clauses = _clean((data.get("clauses_form_data") or {}).get("keyClauses"))

        missing = []
        if not contract_type:
            missing.append("contractType")
        if not party_a:
            missing.append("partyA")
        if not party_b:
            missing.append("partyB")
        if not key_clauses:
            missing.append("keyClauses")
        if missing:
            return self._error(f"缺少必填字段: {', '.join(missing)}")

        payload = {
            "contractType": contract_type,
            "keyClauses": key_clauses,
            "language": language or self.language,
            "partyA": party_a,
            "partyB": party_b,
        }
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "LexHub/1.0",
            "x-mce-signature": f"AppCode/{self.api_key}",
        }

        last_err = ""
        for attempt in range(max(1, self.retries)):
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=self.timeout)
                status = response.status_code
                text = response.text or ""
                try:
                    obj = response.json()
                except Exception:
                    obj = {}
                if not isinstance(obj, dict):
                    return self._error("响应不是 JSON 对象", code=status, raw={"preview": text[:2000]})

                extracted = _extract_contract_payload_from_gateway(obj)
                contract_text = extracted.get("contractText") or ""
                summary = extracted.get("summary") or ""
                key_points = extracted.get("keyPoints") or []
                if not isinstance(key_points, list):
                    key_points = [str(key_points)]
                key_points = [
                    point if isinstance(point, str) else json.dumps(point, ensure_ascii=False)
                    for point in key_points
                ]

                gateway_code = obj.get("code")
                gateway_msg = obj.get("message") or obj.get("msg") or ""
                if gateway_code is not None and gateway_code not in (0, "0", "FP00000"):
                    ok = False
                else:
                    ok = status < 400
                out_code = 0 if ok else (status if status >= 400 else -2)
                return {
                    "success": bool(ok),
                    "code": out_code,
                    "msg": "" if ok else str(gateway_msg),
                    "contractText": contract_text,
                    "summary": summary,
                    "keyPoints": key_points,
                    "raw": {"finalUrl": url, "response": obj},
                }
            except Exception as exc:
                last_err = str(exc)
                logger.warning("Explinks 合同生成失败 attempt=%s: %s", attempt + 1, last_err)
                if attempt < self.retries - 1:
                    time.sleep(0.6 * (attempt + 1))

        return self._error(last_err or "请求失败", code=-2, raw={"finalUrl": url})

    @staticmethod
    def _error(msg: str, *, code: int = -1, raw: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "success": False,
            "code": code,
            "msg": msg,
            "contractText": "",
            "summary": "",
            "keyPoints": [],
            "raw": raw or {},
        }
