"""百度智能云 · 合同审查 TextReview（OAuth + 提交 + 轮询）。"""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any
from urllib.parse import quote, urlsplit

import requests

from app.common.logger_util import logger


def _clean(value: Any) -> str:
    return ("" if value is None else str(value)).strip().strip("`").strip()


def _clean_url(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.startswith("`") and text.endswith("`") and len(text) >= 2:
        text = text[1:-1].strip()
    return text.strip().strip("`").strip()


def _guess_name_from_url(url: str) -> str:
    try:
        path = urlsplit(url).path
        name = path.rsplit("/", 1)[-1]
        return name if name else ""
    except Exception:
        return ""


def _guess_content_type(filename: str) -> str:
    lowered = (filename or "").lower()
    if lowered.endswith(".pdf"):
        return "application/pdf"
    if lowered.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if lowered.endswith(".doc"):
        return "application/msword"
    return "application/octet-stream"


def _multipart_add_field(parts: list[bytes], boundary: str, name: str, value: Any) -> None:
    parts.append(f"--{boundary}\r\n".encode("utf-8"))
    parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
    parts.append((str(value) + "\r\n").encode("utf-8"))


def _multipart_add_file(
    parts: list[bytes],
    boundary: str,
    name: str,
    filename: str,
    content_type: str,
    data_bytes: bytes,
) -> None:
    parts.append(f"--{boundary}\r\n".encode("utf-8"))
    parts.append(
        f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8")
    )
    parts.append(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    parts.append(data_bytes)
    parts.append(b"\r\n")


def _multipart_form(fields: dict[str, Any], boundary: str) -> bytes:
    parts: list[bytes] = []
    for name, value in fields.items():
        _multipart_add_field(parts, boundary, name, value)
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(parts)


class BaiduTextReviewClient:
    OAUTH_URL = "https://aip.baidubce.com/oauth/2.0/token"
    SUBMIT_URL = "https://aip.baidubce.com/file/2.0/brain/online/v1/textreview/task"
    QUERY_URL = "https://aip.baidubce.com/file/2.0/brain/online/v1/textreview/task/query"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        secret_key: str | None = None,
        default_template_name: str | None = None,
    ):
        self.api_key = (api_key or os.environ.get("BAIDU_TEXTREVIEW_API_KEY") or "").strip()
        self.secret_key = (secret_key or os.environ.get("BAIDU_TEXTREVIEW_SECRET_KEY") or "").strip()
        self.default_template_name = (
            default_template_name
            or os.environ.get("BAIDU_TEXTREVIEW_TEMPLATE_NAME")
            or ""
        ).strip()
        self._token_cache: tuple[str, float] | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.secret_key)

    def get_access_token(self, *, force_refresh: bool = False) -> dict[str, Any]:
        if not self.enabled:
            return {"success": False, "access_token": "", "expires_in": 0, "error": "缺少 api_key/secret_key", "raw": {}}

        if not force_refresh and self._token_cache:
            token, expires_at = self._token_cache
            if token and time.time() < expires_at - 60:
                return {"success": True, "access_token": token, "expires_in": int(expires_at - time.time()), "error": "", "raw": {}}

        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key,
        }
        try:
            response = requests.post(self.OAUTH_URL, params=params, timeout=30)
            obj = response.json() if response.text else {}
            if not isinstance(obj, dict):
                return {"success": False, "access_token": "", "expires_in": 0, "error": "响应不是 JSON 对象", "raw": {}}
            token = obj.get("access_token") or ""
            expires_in = int(obj.get("expires_in") or 0)
            error = obj.get("error_description") or obj.get("error") or ""
            if token:
                self._token_cache = (token, time.time() + max(expires_in, 0))
            return {
                "success": bool(token),
                "access_token": token,
                "expires_in": expires_in,
                "error": error,
                "raw": obj,
            }
        except Exception as exc:
            return {"success": False, "access_token": "", "expires_in": 0, "error": str(exc), "raw": {}}

    def submit_task(
        self,
        *,
        source_url: str,
        access_token: str | None = None,
        template_name: str | None = None,
        template_id: str | None = None,
        comment_risk_level: str = "major",
        file_name: str | None = None,
    ) -> dict[str, Any]:
        token = access_token or ""
        if not token:
            token_result = self.get_access_token()
            if not token_result["success"]:
                return {
                    "success": False,
                    "taskId": "",
                    "error_code": -1,
                    "error_msg": token_result.get("error") or "获取 access_token 失败",
                    "log_id": "",
                    "raw": token_result.get("raw") or {},
                }
            token = token_result["access_token"]

        source_url = _clean(source_url)
        template_name = _clean(template_name) or self.default_template_name
        template_id = _clean(template_id)
        if not source_url:
            return self._submit_error("缺少 source_url")
        if not template_name and not template_id:
            return self._submit_error("缺少 templateName/templateId（二选一）")
        if template_name and template_id:
            return self._submit_error("templateName/templateId 只能二选一")

        resolved_name = _clean(file_name) or _guess_name_from_url(source_url) or "contract.docx"
        content_type = _guess_content_type(resolved_name)

        try:
            file_response = requests.get(source_url, timeout=60)
            file_response.raise_for_status()
            file_bytes = file_response.content
        except Exception as exc:
            return self._submit_error(f"下载 source_url 失败: {exc}", code=-2, raw={"source_url": source_url})

        if not file_bytes:
            return self._submit_error("下载到的文件为空", code=-2, raw={"source_url": source_url})
        if len(file_bytes) > 10 * 1024 * 1024:
            return self._submit_error("文件超过 10MB 限制", code=-2, raw={"size": len(file_bytes)})

        fields: dict[str, Any] = {"commentRiskLevel": comment_risk_level or "major"}
        if template_name:
            fields["templateName"] = template_name
        else:
            fields["templateId"] = template_id

        boundary = "----bd-" + uuid.uuid4().hex
        parts: list[bytes] = []
        for key, value in fields.items():
            _multipart_add_field(parts, boundary, key, value)
        _multipart_add_file(parts, boundary, "file", resolved_name, content_type, file_bytes)
        parts.append(f"--{boundary}--\r\n".encode("utf-8"))
        body = b"".join(parts)

        request_url = f"{self.SUBMIT_URL}?access_token={quote(token)}"
        headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        }
        try:
            response = requests.post(request_url, data=body, headers=headers, timeout=60)
            obj = response.json() if response.text else {}
            if not isinstance(obj, dict):
                return self._submit_error("响应不是 JSON 对象", code=-3, raw={"preview": (response.text or "")[:2000]})

            error_code = int(obj.get("error_code") or 0)
            error_msg = obj.get("error_msg") or ""
            log_id = str(obj.get("log_id") or "")
            task_id = ""
            result = obj.get("result") or {}
            if isinstance(result, dict):
                task_id = result.get("taskId") or ""
            return {
                "success": error_code == 0 and bool(task_id),
                "taskId": task_id,
                "error_code": error_code,
                "error_msg": error_msg,
                "log_id": log_id,
                "raw": obj,
            }
        except Exception as exc:
            return self._submit_error(str(exc), code=-4)

    def query_task(
        self,
        *,
        task_id: str,
        access_token: str | None = None,
        timeout: int = 60,
    ) -> dict[str, Any]:
        token = access_token or ""
        if not token:
            token_result = self.get_access_token()
            if not token_result["success"]:
                return self._query_error("获取 access_token 失败", code=-1)
            token = token_result["access_token"]

        task_id = _clean(task_id)
        if not task_id:
            return self._query_error("缺少 taskId", code=-1)

        request_url = f"{self.QUERY_URL}?access_token={quote(token)}"
        boundary = "----bd-" + uuid.uuid4().hex
        body = _multipart_form({"taskId": task_id}, boundary)
        headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Accept": "application/json",
        }
        try:
            response = requests.post(request_url, data=body, headers=headers, timeout=timeout)
            obj = response.json() if response.text else {}
            if not isinstance(obj, dict):
                return self._query_error("响应不是 JSON 对象", code=-3, raw={"preview": (response.text or "")[:2000]})

            error_code = int(obj.get("error_code") or 0)
            error_msg = obj.get("error_msg") or ""
            log_id = str(obj.get("log_id") or "")
            if error_code != 0:
                return self._query_error(error_msg, code=error_code, log_id=log_id, raw=obj)

            result = obj.get("result") or {}
            status = ""
            reason = ""
            report_url = ""
            file_url = ""
            if isinstance(result, dict):
                status = result.get("status") or ""
                reason = result.get("reason") or ""
                textreview_result = result.get("textreviewResult") or []
                if isinstance(textreview_result, list) and textreview_result and isinstance(textreview_result[0], dict):
                    report_url = textreview_result[0].get("reportURL") or ""
                    file_url = textreview_result[0].get("fileURL") or ""

            return {
                "success": status == "success",
                "status": status,
                "reportURL": _clean_url(report_url),
                "fileURL": _clean_url(file_url),
                "reason": reason,
                "error_code": 0,
                "error_msg": "",
                "log_id": log_id,
                "raw": obj,
            }
        except Exception as exc:
            return self._query_error(str(exc), code=-3)

    def poll_task(
        self,
        *,
        task_id: str,
        access_token: str | None = None,
        start_delay_seconds: int = 30,
        poll_interval_seconds: int = 7,
        max_wait_seconds: int = 300,
        timeout: int = 60,
    ) -> dict[str, Any]:
        if start_delay_seconds > 0:
            time.sleep(start_delay_seconds)

        deadline = time.time() + max_wait_seconds
        last_obj: dict[str, Any] = {}
        while time.time() < deadline:
            result = self.query_task(task_id=task_id, access_token=access_token, timeout=timeout)
            last_obj = result.get("raw") if isinstance(result.get("raw"), dict) else {}
            status = result.get("status") or ""
            if status in ("success", "failed"):
                return result
            if result.get("error_code") not in (0, None) and not status:
                return result
            time.sleep(max(1, poll_interval_seconds))

        return self._query_error("轮询超时", code=-4, raw=last_obj)

    @staticmethod
    def _submit_error(msg: str, *, code: int = -1, raw: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "success": False,
            "taskId": "",
            "error_code": code,
            "error_msg": msg,
            "log_id": "",
            "raw": raw or {},
        }

    @staticmethod
    def _query_error(
        msg: str,
        *,
        code: int = -1,
        log_id: str = "",
        raw: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "success": False,
            "status": "",
            "reportURL": "",
            "fileURL": "",
            "reason": "",
            "error_code": code,
            "error_msg": msg,
            "log_id": log_id,
            "raw": raw or {},
        }
