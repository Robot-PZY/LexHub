"""Baidu intelligent document parser with asynchronous polling."""

from __future__ import annotations

import base64
import os
import time
from pathlib import Path
from typing import Any

import requests

from cosight_server.deep_research.services.baidu_ocr import get_baidu_ocr_client


class BaiduDocumentParserClient:
    DEFAULT_SUBMIT_URL = "https://aip.baidubce.com/rest/2.0/brain/online/v2/parser/task"
    DEFAULT_QUERY_URL = "https://aip.baidubce.com/rest/2.0/brain/online/v2/parser/task/query"

    def __init__(self) -> None:
        self.enabled = os.environ.get("BAIDU_DOCUMENT_PARSER_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
        self.submit_url = os.environ.get("BAIDU_DOCUMENT_PARSER_SUBMIT_URL", self.DEFAULT_SUBMIT_URL).strip()
        self.query_url = os.environ.get("BAIDU_DOCUMENT_PARSER_QUERY_URL", self.DEFAULT_QUERY_URL).strip()
        self.request_timeout = float(os.environ.get("BAIDU_DOCUMENT_PARSER_REQUEST_TIMEOUT", "60"))
        self.poll_interval = max(1.0, float(os.environ.get("BAIDU_DOCUMENT_PARSER_POLL_INTERVAL", "5")))
        self.poll_timeout = max(self.poll_interval, float(os.environ.get("BAIDU_DOCUMENT_PARSER_POLL_TIMEOUT", "120")))

    @property
    def configured(self) -> bool:
        return self.enabled and get_baidu_ocr_client().enabled

    @staticmethod
    def _validate(payload: dict[str, Any]) -> dict[str, Any]:
        error_code = payload.get("error_code")
        if error_code not in (None, 0, "0"):
            raise RuntimeError(f"Baidu document parser error {error_code}: {payload.get('error_msg', 'unknown')}")
        result = payload.get("result")
        return result if isinstance(result, dict) else {}

    def _post(self, endpoint: str, data: dict[str, str]) -> dict[str, Any]:
        token = get_baidu_ocr_client()._get_access_token()
        response = requests.post(
            endpoint,
            params={"access_token": token},
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=self.request_timeout,
        )
        response.raise_for_status()
        return self._validate(response.json())

    def submit_file(self, file_path: str | Path) -> str:
        path = Path(file_path)
        size_limit = 50 * 1024 * 1024
        if path.stat().st_size > size_limit:
            raise ValueError("Baidu document parser local upload is limited to 50 MB")
        result = self._post(
            self.submit_url,
            {
                "file_data": base64.b64encode(path.read_bytes()).decode("ascii"),
                "file_name": path.name,
                "recognize_formula": "true",
                "analysis_chart": "true",
                "angle_adjust": "true",
                "parse_image_layout": "true",
                "language_type": "CHN_ENG",
                "html_table_format": "true",
            },
        )
        task_id = str(result.get("task_id") or "")
        if not task_id:
            raise RuntimeError("Baidu document parser did not return task_id")
        return task_id

    def wait_result(self, task_id: str) -> dict[str, Any]:
        deadline = time.monotonic() + self.poll_timeout
        while time.monotonic() < deadline:
            result = self._post(self.query_url, {"task_id": task_id})
            status = str(result.get("status") or "").lower()
            if status == "success":
                return result
            if status == "failed":
                raise RuntimeError(f"Baidu document parser task failed: {result.get('task_error') or 'unknown'}")
            time.sleep(self.poll_interval)
        raise TimeoutError(f"Baidu document parser timed out after {self.poll_timeout:g}s")

    def parse_file(self, file_path: str | Path) -> str:
        result = self.wait_result(self.submit_file(file_path))
        markdown_url = str(result.get("markdown_url") or "")
        if markdown_url:
            response = requests.get(markdown_url, timeout=self.request_timeout)
            response.raise_for_status()
            return response.text
        parse_result_url = str(result.get("parse_result_url") or "")
        if not parse_result_url:
            raise RuntimeError("Baidu document parser returned no result URL")
        response = requests.get(parse_result_url, timeout=self.request_timeout)
        response.raise_for_status()
        payload = response.json()
        sections: list[str] = []
        for page in payload.get("pages") or []:
            page_number = page.get("page_num") or len(sections) + 1
            text = str(page.get("text") or "").strip()
            tables = [str(table.get("markdown") or "").strip() for table in page.get("tables") or []]
            content = "\n\n".join(item for item in (text, *tables) if item)
            sections.append(f"## 第 {page_number} 页\n\n{content}")
        return "\n\n".join(sections)


def get_baidu_document_parser_client() -> BaiduDocumentParserClient:
    return BaiduDocumentParserClient()
