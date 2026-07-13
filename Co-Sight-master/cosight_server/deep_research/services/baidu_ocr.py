"""Baidu OCR client with token caching and scanned-PDF support."""

from __future__ import annotations

import base64
import os
import threading
import time
from pathlib import Path
from typing import Any

import requests

from app.common.logger_util import logger


class BaiduOcrClient:
    TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token"
    DEFAULT_OCR_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic"
    DEFAULT_TABLE_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/table"
    DEFAULT_SEAL_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/seal"

    def __init__(self) -> None:
        self.api_key = os.environ.get("BAIDU_OCR_API_KEY", "").strip()
        self.secret_key = os.environ.get("BAIDU_OCR_SECRET_KEY", "").strip()
        self.endpoint = os.environ.get("BAIDU_OCR_ENDPOINT", self.DEFAULT_OCR_URL).strip()
        self.table_endpoint = os.environ.get("BAIDU_OCR_TABLE_ENDPOINT", self.DEFAULT_TABLE_URL).strip()
        self.seal_endpoint = os.environ.get("BAIDU_OCR_SEAL_ENDPOINT", self.DEFAULT_SEAL_URL).strip()
        self.features = {
            item.strip().lower()
            for item in os.environ.get("BAIDU_OCR_FEATURES", "table,seal").split(",")
            if item.strip()
        }
        self.enrich_max_pages = max(0, int(os.environ.get("BAIDU_OCR_ENRICH_MAX_PAGES", "5")))
        self.timeout = float(os.environ.get("BAIDU_OCR_TIMEOUT", "30"))
        self.max_pdf_pages = max(1, int(os.environ.get("BAIDU_OCR_MAX_PDF_PAGES", "20")))
        self.render_scale = max(1.0, min(float(os.environ.get("BAIDU_OCR_PDF_SCALE", "2")), 3.0))
        self._access_token = ""
        self._token_expires_at = 0.0
        self._token_lock = threading.Lock()

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.secret_key)

    def _get_access_token(self) -> str:
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token
        with self._token_lock:
            if self._access_token and time.time() < self._token_expires_at:
                return self._access_token
            response = requests.post(
                self.TOKEN_URL,
                params={
                    "grant_type": "client_credentials",
                    "client_id": self.api_key,
                    "client_secret": self.secret_key,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            payload = response.json()
            token = str(payload.get("access_token") or "")
            if not token:
                raise RuntimeError(f"Baidu OCR token error: {payload.get('error_description') or payload.get('error') or 'unknown'}")
            expires_in = max(300, int(payload.get("expires_in") or 2_592_000))
            self._access_token = token
            self._token_expires_at = time.time() + expires_in - 120
            return token

    def _post_image(self, endpoint: str, image_bytes: bytes, **options: str) -> dict[str, Any]:
        if not self.enabled:
            raise RuntimeError("Baidu OCR is not configured")
        response = requests.post(
            endpoint,
            params={"access_token": self._get_access_token()},
            data={
                "image": base64.b64encode(image_bytes).decode("ascii"),
                **options,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("error_code"):
            raise RuntimeError(f"Baidu OCR error {payload.get('error_code')}: {payload.get('error_msg', 'unknown')}")
        return payload

    def _recognize_bytes(self, image_bytes: bytes) -> dict[str, Any]:
        return self._post_image(
            self.endpoint,
            image_bytes,
            language_type="CHN_ENG",
            detect_direction="true",
            probability="true",
        )

    @staticmethod
    def _payload_text(payload: dict[str, Any]) -> str:
        words = []
        for item in payload.get("words_result") or []:
            value = str(item.get("words") or "").strip()
            if value:
                words.append(value)
        return "\n".join(words)

    @staticmethod
    def _table_text(payload: dict[str, Any]) -> str:
        rows: list[str] = []
        for table_index, table in enumerate(payload.get("tables_result") or [], 1):
            rows.append(f"表格 {table_index}")
            for item in table.get("header") or []:
                value = str(item.get("words") or "").strip()
                if value:
                    rows.append(f"表头：{value}")
            cells = sorted(
                table.get("body") or [],
                key=lambda item: (int(item.get("row_start") or 0), int(item.get("col_start") or 0)),
            )
            for item in cells:
                value = str(item.get("words") or "").strip()
                if value:
                    rows.append(f"R{int(item.get('row_start') or 0) + 1}C{int(item.get('col_start') or 0) + 1}：{value}")
        return "\n".join(rows)

    @staticmethod
    def _seal_text(payload: dict[str, Any]) -> str:
        seals: list[str] = []
        for index, item in enumerate(payload.get("result") or [], 1):
            words = [str((item.get("major") or {}).get("words") or "").strip()]
            words.extend(str(part.get("words") or "").strip() for part in item.get("minor") or [])
            words = [word for word in words if word]
            if words:
                confidence = item.get("probability")
                confidence_text = f"，置信度 {float(confidence):.2%}" if confidence is not None else ""
                seals.append(f"印章 {index}（{item.get('type') or 'unknown'}{confidence_text}）：{' / '.join(words)}")
        return "\n".join(seals)

    def _enrichment_text(self, image_bytes: bytes) -> str:
        sections: list[str] = []
        feature_calls = (
            ("table", self.table_endpoint, self._table_text),
            ("seal", self.seal_endpoint, self._seal_text),
        )
        for feature, endpoint, formatter in feature_calls:
            if feature not in self.features:
                continue
            try:
                text = formatter(self._post_image(endpoint, image_bytes))
                if text:
                    sections.append(f"【{feature.upper()} 结构化识别】\n{text}")
            except Exception as exc:
                logger.warning("Baidu OCR optional feature failed: feature=%s, error=%s", feature, exc)
        return "\n\n".join(sections)

    def _recognize_image_bytes(self, image_bytes: bytes, enrich: bool = True) -> str:
        text = self._payload_text(self._recognize_bytes(image_bytes))
        enrichment = self._enrichment_text(image_bytes) if enrich else ""
        return "\n\n".join(section for section in (text, enrichment) if section)

    def recognize_file(self, file_path: str | Path) -> str:
        path = Path(file_path)
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self._recognize_pdf(path)
        if suffix not in {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}:
            raise ValueError(f"Unsupported OCR file type: {suffix}")
        return self._recognize_image_bytes(path.read_bytes())

    def _recognize_pdf(self, path: Path) -> str:
        import fitz

        document = fitz.open(path)
        total_pages = document.page_count
        page_count = min(total_pages, self.max_pdf_pages)
        pages: list[str] = []
        try:
            matrix = fitz.Matrix(self.render_scale, self.render_scale)
            for page_index in range(page_count):
                pixmap = document.load_page(page_index).get_pixmap(matrix=matrix, alpha=False)
                image_bytes = pixmap.tobytes("png")
                text = self._recognize_image_bytes(image_bytes, enrich=page_index < self.enrich_max_pages)
                pages.append(f"【第 {page_index + 1} 页】\n{text}" if text else f"【第 {page_index + 1} 页】\n（未识别到文字）")
        finally:
            document.close()
        if page_count < total_pages:
            logger.warning("Baidu OCR PDF truncated: pages=%s/%s, file=%s", page_count, total_pages, path.name)
        return "\n\n".join(pages)


_client: BaiduOcrClient | None = None
_client_signature: tuple[str, ...] | None = None


def get_baidu_ocr_client() -> BaiduOcrClient:
    global _client, _client_signature
    signature = (
        os.environ.get("BAIDU_OCR_API_KEY", "").strip(),
        os.environ.get("BAIDU_OCR_SECRET_KEY", "").strip(),
        os.environ.get("BAIDU_OCR_ENDPOINT", BaiduOcrClient.DEFAULT_OCR_URL).strip(),
        os.environ.get("BAIDU_OCR_TABLE_ENDPOINT", BaiduOcrClient.DEFAULT_TABLE_URL).strip(),
        os.environ.get("BAIDU_OCR_SEAL_ENDPOINT", BaiduOcrClient.DEFAULT_SEAL_URL).strip(),
        os.environ.get("BAIDU_OCR_FEATURES", "table,seal").strip(),
        os.environ.get("BAIDU_OCR_ENRICH_MAX_PAGES", "5").strip(),
    )
    if _client is None or signature != _client_signature:
        _client = BaiduOcrClient()
        _client_signature = signature
    return _client
