"""将本地上传文件解析为公网可访问 URL（供百度 TextReview 等外部服务拉取）。"""

from __future__ import annotations

import os
from urllib.parse import quote

from cosight_server.deep_research.common.config import custom_config_data


def _resolve_upload_root() -> str:
    upload_dir_env = os.getenv("TRAFFIC_OPS_UPLOAD_DIR")
    if upload_dir_env:
        base = os.path.join(upload_dir_env, "upload_files")
    else:
        base = "upload_files"
    root = os.path.join(base, "admin")
    os.makedirs(root, exist_ok=True)
    return root


def resolve_public_api_base_url() -> str:
    """优先 PUBLIC_API_BASE_URL，否则回退本地开发地址。"""
    explicit = (os.environ.get("PUBLIC_API_BASE_URL") or "").strip().rstrip("/")
    if explicit:
        return explicit
    port = str(custom_config_data.get("search_port") or "7788")
    base_api = str(custom_config_data.get("base_api_url") or "/api/nae-deep-research/v1").rstrip("/")
    return f"http://127.0.0.1:{port}{base_api}"


def build_upload_download_url(upload_id: str, filename: str) -> str:
    base = resolve_public_api_base_url()
    safe_name = quote(os.path.basename(filename))
    return f"{base}/upload_files/admin/{upload_id}/{safe_name}"


def resolve_upload_file_url(upload_id: str, filename: str | None = None) -> str | None:
    upload_root = _resolve_upload_root()
    upload_dir = os.path.join(upload_root, upload_id)
    if not os.path.isdir(upload_dir):
        return None
    if filename:
        path = os.path.join(upload_dir, os.path.basename(filename))
        if not os.path.isfile(path):
            return None
        return build_upload_download_url(upload_id, filename)
    for name in sorted(os.listdir(upload_dir)):
        path = os.path.join(upload_dir, name)
        if os.path.isfile(path):
            return build_upload_download_url(upload_id, name)
    return None
