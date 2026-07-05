"""得理法律开放平台客户端（同步版）。"""

from __future__ import annotations

import os
from typing import Any

import requests

from app.common.logger_util import logger


class DeliLegalClient:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        appid: str | None = None,
        secret: str | None = None,
    ):
        self.base_url = (base_url or os.environ.get("DELILEGAL_BASE_URL") or "https://openapi.delilegal.com").rstrip("/")
        self.appid = (appid or os.environ.get("DELILEGAL_APPID") or os.environ.get("LEGAL_SEARCH_API_KEY") or "").strip()
        self.secret = (secret or os.environ.get("DELILEGAL_SECRET") or os.environ.get("LAW_DB_API_KEY") or "").strip()

    @property
    def enabled(self) -> bool:
        return bool(self.appid and self.secret and os.environ.get("DELILEGAL_ENABLED", "true").lower() in ("1", "true", "yes"))

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "appid": self.appid,
            "secret": self.secret,
        }

    def search_law(self, query: str, *, limit: int = 5) -> list[dict[str, Any]]:
        if not self.enabled or not query.strip():
            return []
        payload = {
            "pageNo": 1,
            "pageSize": min(limit, 10),
            "sortField": "correlation",
            "sortOrder": "desc",
            "condition": {"keywords": [query.strip()]},
        }
        try:
            resp = requests.post(
                f"{self.base_url}/api/qa/v3/search/queryListLaw",
                headers=self._headers(),
                json=payload,
                timeout=20,
            )
            resp.raise_for_status()
            body = (resp.json().get("body") or {})
            rows = body.get("data") or []
            out = []
            for row in rows[:limit]:
                if not isinstance(row, dict):
                    continue
                out.append({
                    "source": "得理法律",
                    "id": row.get("id") or row.get("lawId"),
                    "title": row.get("title") or "",
                    "publisher": row.get("publisherName") or "",
                    "timeliness": row.get("timelinessName") or "",
                    "publish_date": row.get("publishDate") or "",
                    "content": (
                        f"效力：{row.get('timelinessName') or ''}；"
                        f"发布机关：{row.get('publisherName') or ''}；"
                        f"发布日期：{row.get('publishDate') or ''}"
                    ),
                })
            return out
        except Exception as exc:
            logger.warning("DeliLegal search_law failed: %s", exc)
            return []

    def search_case(self, query: str, *, limit: int = 5) -> list[dict[str, Any]]:
        if not self.enabled or not query.strip():
            return []
        payload = {
            "pageNo": 1,
            "pageSize": min(limit, 10),
            "sortField": "correlation",
            "sortOrder": "desc",
            "condition": {"keywordArr": [query.strip()]},
        }
        try:
            resp = requests.post(
                f"{self.base_url}/api/qa/v3/search/queryListCase",
                headers=self._headers(),
                json=payload,
                timeout=20,
            )
            resp.raise_for_status()
            body = (resp.json().get("body") or {})
            rows = body.get("data") or []
            out = []
            for row in rows[:limit]:
                if not isinstance(row, dict):
                    continue
                out.append({
                    "source": "得理法律",
                    "id": row.get("id"),
                    "title": row.get("title") or row.get("caseName") or "",
                    "case_number": row.get("caseNumber") or row.get("caseNo") or "",
                    "court": row.get("court") or "",
                    "content": (row.get("summary") or row.get("courtView") or "")[:1200],
                })
            return out
        except Exception as exc:
            logger.warning("DeliLegal search_case failed: %s", exc)
            return []
