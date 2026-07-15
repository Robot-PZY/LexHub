# Copyright 2025 ZTE Corporation.
# All Rights Reserved.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

import json
import os
import re
import shutil
import uuid
import importlib.util
from datetime import datetime
from typing import Dict, List, Literal
from urllib.parse import quote

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.params import Body
from fastapi.responses import Response
from pydantic import BaseModel

from cosight_server.sdk.common.api_result import json_result
from cosight_server.sdk.common.cache import Cache
from cosight_server.deep_research.common.config import custom_config_data
from cosight_server.deep_research.services.document_export import build_export_file
from cosight_server.deep_research.services.audit_log import build_audit_log, build_review_from_audit
from cosight_server.deep_research.services.execution_snapshot import (
    build_export_sections_from_snapshot,
    load_execution_snapshot,
    parse_replay_events,
)
from cosight_server.deep_research.services.metrics_aggregator import (
    aggregate_replay_metrics,
    build_analytics_from_replays,
    build_performance_benchmark,
)
from app.common.logger_util import logger

commonRouter = APIRouter()

server_start_timestamp = int(datetime.now().timestamp() * 1000)
MAX_UPLOAD_FILES = 12
MAX_UPLOAD_FILE_BYTES = 25 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".md",
    ".png", ".jpg", ".jpeg", ".webp",
    ".csv", ".xls", ".xlsx", ".zip",
}


class TaskBlueprintRequest(BaseModel):
    scenario: str | None = None
    description: str


class AgentRoutingRequest(BaseModel):
    scenario: str | None = None
    description: str


class ExportDocumentRequest(BaseModel):
    templateId: str = "contract_review_report"
    format: Literal["docx", "pdf"] = "docx"
    title: str | None = None
    sections: List[Dict[str, str]] | None = None
    workspacePath: str | None = None
    executionSnapshot: Dict | None = None
    preferExecution: bool = True


class MaterialTaskRegisterRequest(BaseModel):
    userAccount: str
    taskId: str
    taskTitle: str | None = None
    scenario: str | None = None
    workspacePath: str
    uploadIds: List[str] = []


def _resolve_workspace_root() -> str:
    workspace_env = os.environ.get("WORKSPACE_PATH")
    if workspace_env:
        normalized = os.path.normpath(workspace_env)
        base_name = os.path.basename(normalized)
        if base_name == "work_space":
            return normalized
        if base_name.startswith("work_space_"):
            return os.path.dirname(normalized)
        return os.path.join(normalized, "work_space")
    return os.path.join(os.getcwd(), "work_space")


def _collect_replay_stats() -> Dict:
    workspace_root = _resolve_workspace_root()
    replay_base = os.path.join(workspace_root, "replay_history")
    seen: set[str] = set()
    replay_count = 0
    latest_replay_time = None

    def _scan(base_dir: str) -> None:
        nonlocal replay_count, latest_replay_time
        if not os.path.exists(base_dir):
            return

        for folder_name in os.listdir(base_dir):
            folder_path = os.path.join(base_dir, folder_name)
            replay_file_path = os.path.join(folder_path, "replay.json")
            if folder_name in seen or not os.path.isdir(folder_path) or not os.path.exists(replay_file_path):
                continue

            seen.add(folder_name)
            replay_count += 1
            mtime = datetime.fromtimestamp(os.path.getmtime(replay_file_path)).isoformat()
            if latest_replay_time is None or mtime > latest_replay_time:
                latest_replay_time = mtime

    _scan(replay_base)
    _scan(workspace_root)

    active_workspace_count = 0
    if os.path.exists(workspace_root):
        active_workspace_count = len([
            item for item in os.listdir(workspace_root)
            if item.startswith("work_space_") and os.path.isdir(os.path.join(workspace_root, item))
        ])

    return {
        "workspace_root": workspace_root,
        "replay_count": replay_count,
        "latest_replay_time": latest_replay_time,
        "active_workspace_count": active_workspace_count,
    }


def _resolve_upload_root() -> str:
    upload_dir_env = os.getenv("TRAFFIC_OPS_UPLOAD_DIR")
    if upload_dir_env:
        base = os.path.join(upload_dir_env, "upload_files")
    else:
        base = "upload_files"
    root = os.path.join(base, "admin")
    os.makedirs(root, exist_ok=True)
    return root


def copy_uploaded_files_to_workspace(upload_ids: List[str], workspace_path: str) -> Dict:
    """将 upload_files/admin/{id} 下的文件复制到任务工作区。"""
    if not workspace_path:
        return {"success": False, "copied_count": 0, "message": "workspace_path is empty"}

    os.makedirs(workspace_path, exist_ok=True)
    upload_root = _resolve_upload_root()
    copied_count = 0
    errors: List[str] = []

    for upload_id in upload_ids:
        source_dir = os.path.join(upload_root, str(upload_id))
        if not os.path.isdir(source_dir):
            errors.append(f"missing upload id: {upload_id}")
            continue
        for name in os.listdir(source_dir):
            src = os.path.join(source_dir, name)
            if not os.path.isfile(src):
                continue
            dest = os.path.join(workspace_path, name)
            shutil.copy2(src, dest)
            copied_count += 1

    return {
        "success": copied_count > 0 and not errors,
        "copied_count": copied_count,
        "message": "; ".join(errors) if errors else "ok",
    }


@commonRouter.post("/upload/files")
async def upload_files(
    files: List[UploadFile] = File(...),
    user_account: str = Form(""),
    task_id: str = Form(""),
    task_title: str = Form(""),
):
    """上传材料到 upload_files/admin/{upload_id}/"""
    if not files:
        return json_result(1, "no files uploaded", None)
    if len(files) > MAX_UPLOAD_FILES:
        return json_result(1, f"too many files, max {MAX_UPLOAD_FILES}", None)

    upload_root = _resolve_upload_root()
    upload_id = str(uuid.uuid4())
    target_dir = os.path.join(upload_root, upload_id)
    os.makedirs(target_dir, exist_ok=True)

    saved = []
    for item in files:
        filename = os.path.basename(item.filename or "unnamed")
        ext = os.path.splitext(filename)[1].lower()
        if ext and ext not in ALLOWED_UPLOAD_EXTENSIONS:
            shutil.rmtree(target_dir, ignore_errors=True)
            return json_result(1, f"unsupported file type: {ext}", None)
        dest = os.path.join(target_dir, filename)
        content = await item.read()
        if len(content) > MAX_UPLOAD_FILE_BYTES:
            shutil.rmtree(target_dir, ignore_errors=True)
            return json_result(1, f"file too large: {filename}", None)
        with open(dest, "wb") as f:
            f.write(content)
        saved.append({
            "upload_id": upload_id,
            "filename": filename,
            "size": len(content),
            "size_mb": round(len(content) / (1024 * 1024), 2),
        })

    if user_account.strip() or task_id.strip():
        _register_upload_meta(
            upload_id,
            user_account.strip() or "user",
            task_id.strip() or upload_id,
            task_title.strip() or None,
        )

    return json_result(0, "success", {
        "upload_id": upload_id,
        "files": saved,
    })


def _get_runtime_status() -> Dict:
    stats = _collect_replay_stats()
    required_envs = {
        "API_KEY": bool(os.environ.get("API_KEY")),
        "API_BASE_URL": bool(os.environ.get("API_BASE_URL")),
        "MODEL_NAME": bool(os.environ.get("MODEL_NAME")),
    }
    optional_tools = {
        "tavily_search": bool(os.environ.get("TAVILY_API_KEY")),
        "wikipedia_search": True,
    }
    server_uptime_seconds = max(0, int(datetime.now().timestamp()) - int(server_start_timestamp / 1000))
    base_chatbot_api_url = custom_config_data.get("base_chatbot_api_url", "/api/openans-support-chatbot/v1")
    websocket_path = f"{base_chatbot_api_url}/robot/wss/messages"
    workspace_ready = os.path.exists(stats["workspace_root"])
    runtime_ready = all(required_envs.values()) and workspace_ready

    return {
        "status": "ready" if runtime_ready else "degraded",
        "summary": "演示环境已具备核心执行条件。" if runtime_ready else "演示环境仍有配置项待补齐。",
        "required_envs": required_envs,
        "optional_tools": optional_tools,
        "workspace_ready": workspace_ready,
        "websocket_path": websocket_path,
        "server_uptime_seconds": server_uptime_seconds,
        "server_start_timestamp": server_start_timestamp,
        "stats": stats,
    }


def _env_status(env_keys: List[str], *, require_all: bool = False) -> str:
    if not env_keys:
        return "planned"
    if require_all:
        return "ready" if all(os.environ.get(key) for key in env_keys) else "missing_key"
    return "ready" if any(os.environ.get(key) for key in env_keys) else "missing_key"


def _document_export_status() -> str:
    # 文书导出是本地能力，不应要求用户额外配置 API Key。
    if importlib.util.find_spec("docx") is None:
        return "missing_key"
    return "ready"


def _ocr_status() -> str:
    baidu_ready = bool(os.environ.get("BAIDU_OCR_API_KEY") and os.environ.get("BAIDU_OCR_SECRET_KEY"))
    aliyun_ready = bool(
        os.environ.get("ALIYUN_OCR_ACCESS_KEY_ID")
        and os.environ.get("ALIYUN_OCR_ACCESS_KEY_SECRET")
    )
    paddle_ready = bool(os.environ.get("PADDLE_OCR_ENDPOINT"))
    return "ready" if baidu_ready or aliyun_ready or paddle_ready else "missing_key"


def _legal_scenarios() -> List[Dict]:
    return [
        {
            "id": "general_analysis",
            "title": "通用分析",
            "description": "梳理事实、归纳问题、给出可执行建议（不限定法律子类）。",
            "examples": ["请根据现有材料归纳核心问题并给出下一步建议。"],
        },
        {
            "id": "material_digest",
            "title": "材料解读",
            "description": "解读上传文件，提取要点、时间线与待补充项。",
            "examples": ["请阅读上传材料，提取关键事实与争议焦点。"],
        },
        {
            "id": "research_summary",
            "title": "调研摘要",
            "description": "结合公开检索与知识库，输出结构化调研结论。",
            "examples": ["围绕指定主题检索公开依据并输出调研摘要。"],
        },
        {
            "id": "contract_review",
            "title": "合同审查",
            "description": "识别付款、违约、解除、争议解决、数据与知识产权条款风险。",
            "examples": ["合作协议审查", "服务合同风险标注", "采购合同履约分析"],
        },
        {
            "id": "corporate_affairs",
            "title": "公司事务",
            "description": "梳理主体信息、股权结构、决议材料和治理合规风险。",
            "examples": ["股权争议研究", "董事会决议核验", "企业主体尽调"],
        },
        {
            "id": "dispute_resolution",
            "title": "争议解决",
            "description": "形成事实时间线、证据清单、请求基础和下一步处理建议。",
            "examples": ["合同解除争议", "侵权责任分析", "仲裁材料准备"],
        },
        {
            "id": "compliance_ip",
            "title": "合规与知识产权",
            "description": "核查业务材料中的监管要求、权利归属、授权边界与风险等级。",
            "examples": ["数据合规审查", "商标授权核验", "软件著作权材料整理"],
        },
        {
            "id": "legal_research",
            "title": "法规研究",
            "description": "围绕具体问题组织法规、案例、公开资料和引用依据。",
            "examples": ["同案检索", "法规适用分析", "争议焦点研究"],
        },
        {
            "id": "document_draft",
            "title": "文书起草",
            "description": "基于事实与法规检索，直接生成律师函、法律意见等可导出文书。",
            "examples": ["起草律师函", "生成法律意见摘要", "催告函撰写"],
        },
    ]


def _agent_catalog() -> List[Dict]:
    return [
        {
            "id": "planner",
            "name": "任务理解智能体",
            "trigger": "用户提交任务或补充材料",
            "output": "场景、目标产出、材料状态、调度建议",
            "statusLabel": "常驻调度",
        },
        {
            "id": "evidence",
            "name": "证据质检智能体",
            "trigger": "材料完整度不足或存在矛盾",
            "output": "缺口清单、OCR 解析、证据支撑度",
            "statusLabel": "条件触发",
        },
        {
            "id": "research",
            "name": "法规研究智能体",
            "trigger": "法律依据缺失或争议焦点复杂",
            "output": "法规引用、案例线索、研究结论",
            "statusLabel": "条件触发",
        },
        {
            "id": "drafting",
            "name": "文书生成智能体",
            "trigger": "用户目标包含报告、律师函、意见书",
            "output": "结构化草稿、导出字段、归档摘要",
            "statusLabel": "目标触发",
        },
        {
            "id": "review",
            "name": "交叉审查智能体",
            "trigger": "高风险、低置信度或即将导出",
            "output": "事实一致性、引用匹配、幻觉风险、自动校验项",
            "statusLabel": "强制复核",
        },
        {
            "id": "compliance",
            "name": "合规监测智能体",
            "trigger": "导出前或涉及监管/合规关键词",
            "output": "审计链封存、合规表述提示、归档摘要",
            "statusLabel": "导出门禁",
        },
    ]


def _legal_workflow() -> List[Dict]:
    return [
        {
            "id": "planner",
            "title": "任务理解",
            "description": "识别场景、主体、事实、材料和预期产出。",
            "agent": "任务理解智能体",
        },
        {
            "id": "evidence",
            "title": "证据质检",
            "description": "调用 OCR/文档解析，抽取关键事实与证据缺口。",
            "agent": "证据质检智能体",
        },
        {
            "id": "research",
            "title": "法规研究",
            "description": "调用法规库、搜索 API 与案例来源形成引用依据。",
            "agent": "法规研究智能体",
        },
        {
            "id": "drafting",
            "title": "文书生成",
            "description": "生成审查报告、律师函、法律意见摘要或材料清单。",
            "agent": "文书生成智能体",
        },
        {
            "id": "review",
            "title": "交叉审查",
            "description": "保留工具调用轨迹、引用来源、结论版本和回放记录。",
            "agent": "交叉审查智能体",
        },
        {
            "id": "compliance",
            "title": "合规监测",
            "description": "生成审计链 hash、合规表述提示与导出前门禁摘要。",
            "agent": "合规监测智能体",
        },
    ]


def _estimate_task_metrics(description: str, scenario: str) -> Dict:
    text = (description or "").lower()
    material_keywords = ["材料", "证据", "上传", "凭证", "签署", "缺口", "补充", "扫描"]
    citation_keywords = ["法规", "依据", "引用", "案例", "条款", "检索", "研究"]
    output_keywords = ["报告", "律师函", "意见书", "发函", "导出", "文书", "草稿"]
    risk_keywords = ["解除", "违约", "索赔", "争议", "高风险", "诉讼", "仲裁"]

    material_score = 42 + min(40, sum(6 for kw in material_keywords if kw in text))
    citation_score = 28 + min(45, sum(8 for kw in citation_keywords if kw in text))
    if scenario in ("legal_research", "dispute_resolution"):
        citation_score = max(citation_score, 35)

    risk_level = "medium"
    if any(kw in text for kw in risk_keywords):
        risk_level = "high"
    elif len(description) < 24:
        risk_level = "low"

    wants_output = any(kw in text for kw in output_keywords)
    return {
        "materialCompleteness": min(95, material_score),
        "citationCoverage": min(92, citation_score),
        "riskLevel": risk_level,
        "wantsOutput": wants_output,
    }


def _build_dynamic_routing(scenario: str, description: str) -> Dict:
    metrics = _estimate_task_metrics(description, scenario)
    material = metrics["materialCompleteness"]
    citation = metrics["citationCoverage"]
    risk = metrics["riskLevel"]
    wants_output = metrics["wantsOutput"]

    active_agents = [
        {
            "id": "planner",
            "name": "任务理解智能体",
            "status": "active",
            "trigger": "任务提交",
            "reason": "识别场景、目标产出与材料状态，生成调度建议。",
        }
    ]
    routing_decisions = [
        "任务理解智能体常驻启动，负责拆解场景与目标产出。",
    ]
    next_suggestion = "补充任务描述与关键材料，系统将给出更精确的调度建议。"

    if material < 70:
        active_agents.append({
            "id": "evidence",
            "name": "证据质检智能体",
            "status": "active",
            "trigger": f"材料完整度 {material}%",
            "reason": "材料完整度偏低，优先补齐签署页、付款凭证与履行记录。",
        })
        routing_decisions.append("材料完整度低于 70%，优先调度证据质检智能体。")
        next_suggestion = "先完成证据质检，补齐关键材料后再进入法规研究或文书生成。"
    else:
        active_agents.append({
            "id": "evidence",
            "name": "证据质检智能体",
            "status": "skipped",
            "trigger": f"材料完整度 {material}%",
            "reason": "当前材料基本完整，可跳过或轻量抽检。",
        })

    if citation < 55 or scenario in ("legal_research", "dispute_resolution"):
        active_agents.append({
            "id": "research",
            "name": "法规研究智能体",
            "status": "active",
            "trigger": f"法规引用度 {citation}%",
            "reason": "法律依据不足或争议焦点复杂，需要补充法规与案例引用。",
        })
        routing_decisions.append("法规引用不足，调度法规研究智能体补充依据。")
        if material >= 70:
            next_suggestion = "进入法规研究，形成可追溯引用后再生成输出。"
    else:
        active_agents.append({
            "id": "research",
            "name": "法规研究智能体",
            "status": "idle",
            "trigger": f"法规引用度 {citation}%",
            "reason": "当前引用覆盖尚可，可按需触发深度研究。",
        })

    if wants_output or scenario == "contract_review":
        active_agents.append({
            "id": "drafting",
            "name": "文书生成智能体",
            "status": "idle" if material < 70 or citation < 55 else "active",
            "trigger": "目标产出含报告/律师函/意见书",
            "reason": "用户目标包含正式输出，待证据与引用就绪后生成草稿。",
        })
        if material >= 70 and citation >= 55:
            routing_decisions.append("目标产出明确，调度文书生成智能体准备草稿。")
            next_suggestion = "可生成结构化草稿，导出前建议进入交叉审查。"
    else:
        active_agents.append({
            "id": "drafting",
            "name": "文书生成智能体",
            "status": "idle",
            "trigger": "未检测到明确输出目标",
            "reason": "当前以分析研判为主，文书生成按需触发。",
        })

    review_required = risk == "high" or material < 70 or citation < 55 or wants_output
    active_agents.append({
        "id": "review",
        "name": "交叉审查智能体",
        "status": "active" if review_required else "idle",
        "trigger": "高风险/低置信度/导出前",
        "reason": "对事实、证据、法规和文书进行自动交叉校验，标注降级项。",
    })
    if review_required:
        routing_decisions.append("存在高风险或输出需求，强制进入交叉审查智能体。")
        next_suggestion = "导出前完成自动交叉审查，并保留可追溯校验记录。"

    return {
        "taskId": f"task-{uuid.uuid4().hex[:8]}",
        "scenario": scenario,
        "metrics": metrics,
        "activeAgents": active_agents,
        "routingDecisions": routing_decisions,
        "nextSuggestion": next_suggestion,
        "reviewRequired": review_required,
    }


def _build_dynamic_blueprint(scenario: str, description: str) -> List[Dict]:
    routing = _build_dynamic_routing(scenario, description)
    stage_map = {item["id"]: item for item in _legal_workflow()}
    stages = []
    for agent in routing["activeAgents"]:
        if agent["status"] == "skipped":
            continue
        stage = stage_map.get(agent["id"])
        if stage:
            stages.append({
                **stage,
                "description": agent["reason"],
                "trigger": agent["trigger"],
            })
    if not stages:
        stages = _legal_workflow()[:2]
    return stages


def _api_integrations() -> List[Dict]:
    integrations = [
        {
            "id": "ocr",
            "name": "OCR / 文档解析",
            "category": "材料处理",
            "envKeys": ["BAIDU_OCR_API_KEY", "ALIYUN_OCR_ACCESS_KEY_ID", "PADDLE_OCR_ENDPOINT"],
            "purpose": "识别合同、扫描件、图片证据和 PDF 材料中的文字。",
            "status": _ocr_status(),
        },
        {
            "id": "legal_search",
            "name": "得理法律检索",
            "category": "法律研究",
            "envKeys": ["DELILEGAL_APPID", "DELILEGAL_SECRET", "LEGAL_SEARCH_API_KEY", "LAW_DB_API_KEY"],
            "purpose": "检索法规、司法解释、裁判案例与法律观点。",
        },
        {
            "id": "contract_documents",
            "name": "合同文书引擎",
            "category": "合同文书",
            "envKeys": ["API_KEY"],
            "purpose": "LLM + 法规/模板检索：审查报告、合同起草、条款修改备忘，可导出 DOCX/PDF。",
        },
        {
            "id": "contract_review_external",
            "name": "第三方合同审查（可选）",
            "category": "合同文书",
            "envKeys": ["BAIDU_TEXTREVIEW_API_KEY", "BAIDU_TEXTREVIEW_SECRET_KEY"],
            "envRequireAll": True,
            "purpose": "百度 TextReview 等外部 SaaS；需公网文件 URL，演示环境可不配置。",
        },
        {
            "id": "contract_compare",
            "name": "合同版本比对（本地）",
            "category": "合同审查",
            "envKeys": [],
            "purpose": "本地完成多版本合同 diff、增删改统计与修订痕迹，不依赖外部 Key。",
            "status": "ready",
        },
        {
            "id": "web_search",
            "name": "联网搜索",
            "category": "公开资料",
            "envKeys": ["TAVILY_API_KEY"],
            "purpose": "补充公开资料、行业背景、新闻公告与网页来源。",
        },
        {
            "id": "document_export",
            "name": "文书导出",
            "category": "结果交付",
            "envKeys": [],
            "purpose": "导出审查报告、律师函、研究结论和材料归档包。",
            "status": _document_export_status(),
        },
        {
            "id": "vector_rag",
            "name": "本地知识库 / RAG",
            "category": "知识增强",
            "envKeys": ["CHROMA_PERSIST_DIR", "VECTOR_DB_URL"],
            "purpose": "接入法规库、模板库与案例库，实现引用可追溯的检索增强生成。",
        },
    ]
    for item in integrations:
        item["status"] = item.get("status") or _env_status(item["envKeys"], require_all=bool(item.get("envRequireAll")))
        item.pop("envRequireAll", None)
    return integrations

@commonRouter.get("/deep-research/server-timestamp")
async def get_server_timestamp():
    """获取服务器启动时间戳"""
    return json_result(0, 'success', {
        'timestamp': server_start_timestamp
    })

@commonRouter.post("/deep-research/stop-message")
async def stop_message(body: Dict = Body(...)):
    messageId = body.get("messageId")
    logger.info(f"stop_message >>>>>>>>>> is called, messageId: {messageId}")
    Cache.put(f"is_message_stopped_{messageId}", True)
    return json_result(0, 'success', {
        'status': 'stopped'
    })


@commonRouter.get("/demo/overview")
async def get_demo_overview():
    stats = _collect_replay_stats()
    return json_result(0, 'success', {
        'product_name': '律枢 LexHub',
        'system_name': '律枢 · 基于 Co-Sight 的智能法律协同系统',
        'positioning': '基于 Co-Sight 二次开发的状态驱动多智能体法律协同平台，支持任务调度、证据质检、法规研究、交叉审查与归档回放。',
        'primary_story': '展示状态驱动多智能体调度、DAG 任务编排、多 API 工具链与可解释法律任务闭环。',
        'framework': 'Co-Sight',
        'capabilities': [
            '状态驱动多智能体调度',
            'DAG 任务编排与多跳推理',
            '多 API 工具链执行',
            '过程可回放与结果可复核',
        ],
        'competition_capabilities': [
            {'requirement': '多智能体协同（≥2）', 'implementation': '8 个注册智能体按任务动态选择，运行时使用独立模板与工具白名单', 'evidence': '/workspace · /agents'},
            {'requirement': 'DAG 任务引擎编排', 'implementation': 'Co-Sight Plan + DAG 执行视图', 'evidence': '/workspace · /board'},
            {'requirement': '工具/API 调用（≥3 类）', 'implementation': '搜索、代码执行、文档/OCR、法规检索', 'evidence': '/workspace · /research'},
            {'requirement': '多跳推理（>3 跳）', 'implementation': '拆解→材料→检索→生成→审查', 'evidence': 'Replay · StepFlow'},
        ],
        'scenarios': [
            '合同审查',
            '法律检索与类案分析',
            '文书与结论整理',
        ],
        'stats': stats,
    })


@commonRouter.get("/demo/runtime-status")
async def get_demo_runtime_status():
    return json_result(0, 'success', _get_runtime_status())


@commonRouter.get("/demo/legal-capabilities")
async def get_legal_capabilities():
    return json_result(0, 'success', {
        "positioning": "律枢 LexHub · 基于 Co-Sight 的智能法律协同系统",
        "tagline": "状态驱动调度、多智能体协作、多 API 工具调用、过程可回放。",
        "scenarios": _legal_scenarios(),
        "workflow": _legal_workflow(),
        "integrations": _api_integrations(),
        "competitionHighlights": [
            "基于 Co-Sight 进行二次开发，而不是独立聊天应用。",
            "状态驱动多智能体调度，而非固定流程执行。",
            "预留 OCR、企业查询、法规检索、联网搜索、文书导出、RAG 等多 API 工具位。",
            "所有处理过程可回放，便于复核与追溯执行链路。",
        ],
    })


@commonRouter.post("/demo/agent-routing")
async def get_agent_routing(body: AgentRoutingRequest):
    scenario = body.scenario or "general_legal_workflow"
    description = (body.description or "").strip()
    if not description:
        return json_result(1, "description is required", None)
    return json_result(0, "success", _build_dynamic_routing(scenario, description))


def _load_latest_replay_audit() -> Dict | None:
    workspace_root = _resolve_workspace_root()
    replay_base = os.path.join(workspace_root, "replay_history")
    if not os.path.isdir(replay_base):
        return None

    candidates = []
    for folder_name in os.listdir(replay_base):
        replay_path = os.path.join(replay_base, folder_name, "replay.json")
        if os.path.isfile(replay_path):
            candidates.append((os.path.getmtime(replay_path), folder_name, replay_path))

    if not candidates:
        return None

    _, folder_name, replay_path = sorted(candidates, key=lambda item: item[0])[-1]
    events = []
    with open(replay_path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except Exception:
                continue

    if not events:
        return None

    audit_log = build_audit_log(events, folder_name)
    snapshot = parse_replay_events(events)
    review = build_review_from_audit(audit_log, snapshot)
    review["auditLog"] = audit_log
    return review


@commonRouter.get("/demo/review-result")
async def get_review_result(workspace: str | None = None):
    if workspace and workspace.strip():
        try:
            snapshot = load_execution_snapshot(_resolve_workspace_root(), workspace.strip())
            replay_path = snapshot.get("replayFile")
            if replay_path and os.path.isfile(replay_path):
                events = []
                with open(replay_path, "r", encoding="utf-8") as handle:
                    for line in handle:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            events.append(json.loads(line))
                        except Exception:
                            continue
                folder_name = workspace.strip().replace("\\", "/").strip("/").split("/")[-1]
                audit_log = build_audit_log(events, folder_name)
                review = build_review_from_audit(audit_log, snapshot)
                review["auditLog"] = audit_log
                return json_result(0, "success", review)
        except Exception as exc:
            logger.warning("review from workspace failed: %s", exc)

    replay_review = _load_latest_replay_audit()
    if replay_review:
        return json_result(0, "success", replay_review)

    return json_result(0, "success", {
        "overallVerdict": "自动校验完成，存在降级项",
        "dataSource": "baseline",
        "reviewItems": [
            {"label": "事实一致性", "value": "待实测", "detail": "执行 Co-Sight 任务后将基于 replay 自动生成审查矩阵。", "tone": "warning"},
            {"label": "证据支撑性", "value": "待实测", "detail": "工具调用与材料轨迹将写入审计链。", "tone": "warning"},
            {"label": "法规适配性", "value": "待引用", "detail": "可信分级分析完成后可绑定引用来源。", "tone": "warning"},
            {"label": "文书完整性", "value": "草稿", "detail": "建议导出前补充事实时间线与附件清单。", "tone": "primary"},
            {"label": "合规监测", "value": "待归档", "detail": "导出前将生成审计链 hash。", "tone": "warning"},
        ],
        "riskFindings": [
            "尚未发现 replay 记录，请先在工作台执行一条任务。",
        ],
        "stats": {"dimensions": 5, "passed": 0, "warnings": 4, "outputLevel": "草稿"},
    })


@commonRouter.get("/demo/report-summary")
async def get_report_summary():
    return json_result(0, "success", {
        "title": "合同审查任务总结报告",
        "sections": [
            {"title": "任务目标", "desc": "审查合作协议中的付款、违约责任和争议解决条款风险。"},
            {"title": "调度过程", "desc": "系统先调用任务理解与证据质检，再进入法规研究、文书生成和交叉审查。"},
            {"title": "证据结论", "desc": "主体信息基本一致，但签署页、付款凭证和催告记录仍需补充。"},
            {"title": "研究结论", "desc": "当前可形成初步风险提示，正式意见需补充条款级法规引用。"},
            {"title": "审查意见", "desc": "解除、索赔等结论采用审慎表述，并标注依据和风险。"},
        ],
        "agentInvocations": [
            {"name": "任务理解智能体", "count": 1},
            {"name": "证据质检智能体", "count": 2},
            {"name": "法规研究智能体", "count": 1},
            {"name": "文书生成智能体", "count": 1},
            {"name": "交叉审查智能体", "count": 1},
        ],
        "exportFormats": [
            {"id": "pdf", "label": "PDF 报告", "status": "ready"},
            {"id": "docx", "label": "DOCX 文书", "status": "ready"},
            {"id": "zip", "label": "材料包 ZIP", "status": "planned"},
        ],
        "nextActions": [
            {"title": "补齐材料", "desc": "补充签署页、付款凭证和催告记录。"},
            {"title": "自动校验", "desc": "校验解除、索赔和发函措辞的一致性。"},
            {"title": "导出归档", "desc": "生成报告并进入回放中心。"},
        ],
        "stats": {"agents": 5, "findings": 7, "status": "草稿"},
    })


@commonRouter.get("/demo/profile-analysis")
async def get_profile_analysis():
    return json_result(0, "success", {
        "profileCards": [
            {
                "title": "案件画像",
                "items": ["争议类型：合同履行", "风险等级：中高", "处理目标：审查 + 发函准备"],
            },
            {
                "title": "证据画像",
                "items": ["完整度：68%", "强证据：合同文本", "弱证据：聊天截图与付款记录"],
            },
            {
                "title": "主体画像",
                "items": ["签约主体：合同载明双方", "材料一致性：待核对", "履约线索：付款与往来记录"],
            },
        ],
        "dimensions": [
            {"label": "材料完整度", "value": "68%", "tone": "warning"},
            {"label": "法规引用度", "value": "42%", "tone": "warning"},
            {"label": "输出可用度", "value": "草稿", "tone": "primary"},
            {"label": "自动校验等级", "value": "增强", "tone": "warning"},
        ],
        "externalData": [
            {"label": "得理法规检索", "status": "可接入"},
            {"label": "联网搜索", "status": "已就绪"},
            {"label": "本地知识库", "status": "待导入"},
        ],
        "stats": {
            "caseType": "合同争议",
            "riskLevel": "中高",
            "entityCheck": "材料核验",
            "recommendedPath": "补证 + 审查",
        },
    })


@commonRouter.get("/demo/toolchain-status")
async def get_toolchain_status():
    integrations = _api_integrations()
    ready_count = sum(1 for item in integrations if item["status"] == "ready")
    return json_result(0, "success", {
        "integrations": integrations,
        "summary": {
            "total": len(integrations),
            "ready": ready_count,
            "missingKey": sum(1 for item in integrations if item["status"] == "missing_key"),
            "planned": sum(1 for item in integrations if item["status"] == "planned"),
        },
    })


def _load_workflow_config() -> Dict:
    config_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "config", "legal-workflow.json")
    )
    try:
        with open(config_path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {
            "name": "lexhub-legal-workflow",
            "version": "1.0.0",
            "framework": "Co-Sight",
            "agents": _agent_catalog(),
            "routingRules": [
                "材料完整度低于 70%，优先调度证据质检智能体",
                "法规引用缺失，调度法规研究智能体",
                "目标产出明确，调度文书生成智能体",
                "高风险或导出前，强制调度交叉审查智能体",
            ],
        }


def _performance_benchmark() -> Dict:
    workspace_root = _resolve_workspace_root()
    aggregated = aggregate_replay_metrics(workspace_root)
    return build_performance_benchmark(aggregated)


@commonRouter.get("/demo/analytics-overview")
async def get_analytics_overview():
    stats = _collect_replay_stats()
    workspace_root = _resolve_workspace_root()
    aggregated = aggregate_replay_metrics(workspace_root)
    analytics = build_analytics_from_replays(aggregated, stats)
    integrations = _api_integrations()
    ready_count = sum(1 for item in integrations if item["status"] == "ready")
    api_ready_ratio = round((ready_count / len(integrations)) * 100) if integrations else 0

    return json_result(0, "success", {
        "summary": {
            **analytics["summary"],
            "apiReadyRatio": api_ready_ratio,
        },
        "caseStages": analytics["caseStages"],
        "riskDistribution": analytics["riskDistribution"],
        "completenessTrend": analytics["completenessTrend"],
        "agentCalls": analytics["agentCalls"],
        "apiStatus": integrations,
        "performanceBenchmark": build_performance_benchmark(aggregated),
    })


def _load_agent_registry() -> Dict:
    config_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "config", "agent-registry.json")
    )
    try:
        with open(config_path, "r", encoding="utf-8") as handle:
            registry = json.load(handle)
    except Exception:
        workflow = _load_workflow_config()
        agents = workflow.get("agents", _agent_catalog())
        registry = {
            "name": "lexhub-agent-registry",
            "version": "1.0.0",
            "framework": "Co-Sight",
            "agents": [
                {
                    **agent,
                    "role": "orchestrator" if agent.get("id") == "planner" else "worker",
                    "capabilities": [agent.get("trigger", "法律任务")],
                    "registeredTools": [],
                    "triggers": [agent.get("trigger", "")],
                    "modelLabel": agent.get("modelEnv", "Co-Sight Model"),
                }
                for agent in agents
            ],
            "toolCatalog": [],
        }

    try:
        from cosight_server.deep_research.services.admin_runtime_config import load_admin_settings

        custom_tools = [
            item for item in (load_admin_settings().get("mcpTools") or [])
            if item.get("enabled", True)
        ]
        catalog = registry.setdefault("toolCatalog", [])
        catalog_ids = {str(item.get("id") or "") for item in catalog}
        agents_by_id = {
            str(item.get("id") or ""): item
            for item in registry.setdefault("agents", [])
        }
        for tool in custom_tools:
            tool_id = str(tool.get("skill_name") or "").strip()
            if not tool_id:
                continue
            if tool_id not in catalog_ids:
                command = str((tool.get("mcp_server_config") or {}).get("command") or "MCP")
                catalog.append({
                    "id": tool_id,
                    "label": str(tool.get("display_name_zh") or tool_id),
                    "category": "custom",
                    "apiLabel": f"MCP · {command}",
                })
                catalog_ids.add(tool_id)
            for agent_id in tool.get("authorizedAgents") or []:
                agent = agents_by_id.get(str(agent_id))
                if not agent:
                    continue
                registered = agent.setdefault("registeredTools", [])
                if tool_id not in registered:
                    registered.append(tool_id)
    except Exception as exc:
        logger.warning("merge custom tools into agent registry failed: %s", exc)
    return registry


@commonRouter.get("/demo/agent-registry")
async def get_agent_registry():
    return json_result(0, "success", _load_agent_registry())


@commonRouter.get("/demo/workflow-config")
async def get_workflow_config():
    return json_result(0, "success", _load_workflow_config())


@commonRouter.get("/demo/performance-benchmark")
async def get_performance_benchmark():
    return json_result(0, "success", _performance_benchmark())


MATERIAL_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".md", ".xlsx", ".xls",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".zip", ".csv",
}

MATERIAL_SKIP_NAMES = {"replay.json", "plan.json", "task_meta.json"}

INTERMEDIATE_FILE_PATTERNS = (
    re.compile(r"^步骤\s*\d+", re.IGNORECASE),
    re.compile(r"步骤\s*\d+"),
    re.compile(r"[_\s]step\s*\d+", re.IGNORECASE),
    re.compile(r"^step\s*\d+[_\s]", re.IGNORECASE),
    re.compile(r"检索结果"),
    re.compile(r"中间稿|过程稿|intermediate", re.IGNORECASE),
    re.compile(r"_Step\d+", re.IGNORECASE),
)

DELIVERABLE_FILE_PATTERNS = (
    re.compile(r"总结报告|最终报告|综合评估|任务总结|执行报告"),
    re.compile(r"律师函|法律意见书|起诉状|答辩状|交付"),
    re.compile(r"final[_-]?report|deliverable", re.IGNORECASE),
)


def _material_registry_path() -> str:
    return os.path.join(_resolve_upload_root(), "material_registry.json")


def _load_material_registry() -> Dict:
    path = _material_registry_path()
    if not os.path.isfile(path):
        return {"uploads": {}, "tasks": {}}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, dict):
            data.setdefault("uploads", {})
            data.setdefault("tasks", {})
            return data
    except Exception:
        pass
    return {"uploads": {}, "tasks": {}}


def _save_material_registry(registry: Dict) -> None:
    path = _material_registry_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(registry, handle, ensure_ascii=False, indent=2)


def _register_upload_meta(upload_id: str, user_account: str, task_id: str, task_title: str | None) -> None:
    registry = _load_material_registry()
    registry["uploads"][upload_id] = {
        "userAccount": user_account,
        "taskId": task_id,
        "taskTitle": task_title or "",
        "createdAt": datetime.now().isoformat(),
    }
    _save_material_registry(registry)


def _register_task_meta(payload: MaterialTaskRegisterRequest) -> None:
    registry = _load_material_registry()
    workspace_key = os.path.basename(payload.workspacePath.strip())
    registry["tasks"][workspace_key] = {
        "userAccount": payload.userAccount.strip() or "user",
        "taskId": payload.taskId.strip(),
        "taskTitle": (payload.taskTitle or "").strip(),
        "scenario": (payload.scenario or "").strip(),
        "workspacePath": workspace_key,
        "uploadIds": payload.uploadIds or [],
        "createdAt": datetime.now().isoformat(),
    }
    for upload_id in payload.uploadIds or []:
        upload_meta = registry["uploads"].get(upload_id, {})
        upload_meta.update({
            "userAccount": payload.userAccount.strip() or "user",
            "taskId": payload.taskId.strip(),
            "taskTitle": (payload.taskTitle or upload_meta.get("taskTitle") or "").strip(),
            "workspacePath": workspace_key,
        })
        registry["uploads"][upload_id] = upload_meta
    _save_material_registry(registry)

    workspace_root = _resolve_workspace_root()
    meta_path = os.path.join(workspace_root, workspace_key, "task_meta.json")
    os.makedirs(os.path.dirname(meta_path), exist_ok=True)
    with open(meta_path, "w", encoding="utf-8") as handle:
        json.dump(registry["tasks"][workspace_key], handle, ensure_ascii=False, indent=2)


def _read_workspace_task_meta(workspace_folder: str) -> Dict:
    workspace_root = _resolve_workspace_root()
    meta_path = os.path.join(workspace_root, workspace_folder, "task_meta.json")
    if os.path.isfile(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    registry = _load_material_registry()
    return registry.get("tasks", {}).get(workspace_folder, {})


def _is_intermediate_workspace_file(filename: str) -> bool:
    return any(pattern.search(filename) for pattern in INTERMEDIATE_FILE_PATTERNS)


def _is_deliverable_workspace_file(filename: str) -> bool:
    if _is_intermediate_workspace_file(filename):
        return False
    if any(pattern.search(filename) for pattern in DELIVERABLE_FILE_PATTERNS):
        return True
    lower = filename.lower()
    if any(token in lower for token in ("report", "summary")):
        return True
    if "总结" in filename or "报告" in filename:
        return "步骤" not in filename and "step" not in lower
    return False


def _classify_material_kind(filename: str, source: str) -> str:
    if source == "upload":
        return "upload"
    if _is_intermediate_workspace_file(filename):
        return "process"
    if not _is_deliverable_workspace_file(filename):
        return "process"
    lower = filename.lower()
    if "报告" in filename or "总结" in filename or "report" in lower or "summary" in lower:
        return "report"
    return "generated"


def _limit_material_items(items: List[Dict], include_process: bool = False) -> List[Dict]:
    if not include_process:
        items = [item for item in items if item.get("kind") != "process"]

    grouped: Dict[str, List[Dict]] = {}
    for item in items:
        key = item.get("taskId") or item.get("workspacePath") or f"upload-{item.get('uploadId', 'misc')}"
        grouped.setdefault(key, []).append(item)

    limited: List[Dict] = []
    for group in grouped.values():
        uploads = [item for item in group if item.get("kind") == "upload"]
        reports = sorted(
            [item for item in group if item.get("kind") == "report"],
            key=lambda row: row.get("createdAt", ""),
            reverse=True,
        )[:2]
        generated = sorted(
            [item for item in group if item.get("kind") == "generated"],
            key=lambda row: row.get("createdAt", ""),
            reverse=True,
        )[:2]
        limited.extend(uploads)
        limited.extend(reports)
        limited.extend(generated)

    limited.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
    return limited[:80]


def _collect_material_library(
    user_account: str | None = None,
    task_id: str | None = None,
    include_process: bool = False,
) -> Dict:
    items: List[Dict] = []
    base_api = str(custom_config_data.get("base_api_url", "/api/nae-deep-research/v1"))
    registry = _load_material_registry()

    upload_root = _resolve_upload_root()
    if os.path.isdir(upload_root):
        for upload_id in os.listdir(upload_root):
            if upload_id == "material_registry.json":
                continue
            upload_dir = os.path.join(upload_root, upload_id)
            if not os.path.isdir(upload_dir):
                continue
            upload_meta = registry.get("uploads", {}).get(upload_id, {})
            item_user = upload_meta.get("userAccount", "")
            item_task = upload_meta.get("taskId", "")
            if user_account and item_user and item_user != user_account:
                continue
            if user_account and not item_user:
                continue
            if task_id and item_task and item_task != task_id:
                continue
            for name in os.listdir(upload_dir):
                file_path = os.path.join(upload_dir, name)
                if not os.path.isfile(file_path):
                    continue
                ext = os.path.splitext(name)[1].lower()
                if ext and ext not in MATERIAL_EXTENSIONS:
                    continue
                stat = os.stat(file_path)
                items.append({
                    "id": f"upload-{upload_id}-{name}",
                    "name": name,
                    "kind": "upload",
                    "source": "upload",
                    "createdAt": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "sizeMb": round(stat.st_size / (1024 * 1024), 2),
                    "uploadId": upload_id,
                    "userAccount": item_user or None,
                    "taskId": item_task or None,
                    "taskTitle": upload_meta.get("taskTitle") or None,
                    "downloadUrl": f"{base_api}/upload_files/admin/{upload_id}/{quote(name)}",
                })

    workspace_root = _resolve_workspace_root()
    if os.path.isdir(workspace_root):
        for folder_name in os.listdir(workspace_root):
            if not folder_name.startswith("work_space"):
                continue
            task_meta = _read_workspace_task_meta(folder_name)
            item_user = task_meta.get("userAccount", "")
            item_task = task_meta.get("taskId", "")
            if user_account and item_user and item_user != user_account:
                continue
            if user_account and not item_user:
                continue
            if task_id and item_task and item_task != task_id:
                continue
            folder_path = os.path.join(workspace_root, folder_name)
            if not os.path.isdir(folder_path):
                continue
            for root, _, files in os.walk(folder_path):
                if "replay_history" in root.replace("\\", "/"):
                    continue
                for name in files:
                    if name in MATERIAL_SKIP_NAMES or name.endswith(".log"):
                        continue
                    ext = os.path.splitext(name)[1].lower()
                    if ext and ext not in MATERIAL_EXTENSIONS:
                        continue
                    file_path = os.path.join(root, name)
                    if not os.path.isfile(file_path):
                        continue
                    rel = os.path.relpath(file_path, workspace_root).replace("\\", "/")
                    stat = os.stat(file_path)
                    kind = _classify_material_kind(name, "workspace")
                    items.append({
                        "id": f"ws-{rel}",
                        "name": name,
                        "kind": kind,
                        "source": "workspace",
                        "createdAt": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "sizeMb": round(stat.st_size / (1024 * 1024), 2),
                        "workspacePath": folder_name,
                        "userAccount": item_user or None,
                        "taskId": item_task or None,
                        "taskTitle": task_meta.get("taskTitle") or None,
                        "downloadUrl": f"{base_api}/work_space/{quote(rel)}",
                    })

    items.sort(key=lambda item: item.get("createdAt", ""), reverse=True)
    visible_items = _limit_material_items(items, include_process=include_process)
    uploads = sum(1 for item in visible_items if item["kind"] == "upload")
    generated = sum(1 for item in visible_items if item["kind"] == "generated")
    reports = sum(1 for item in visible_items if item["kind"] == "report")
    process = sum(1 for item in items if item["kind"] == "process")

    return {
        "items": visible_items if not include_process else items[:120],
        "stats": {
            "total": len(visible_items),
            "uploads": uploads,
            "generated": generated,
            "reports": reports,
            "process": process,
        },
    }


@commonRouter.get("/demo/material-library")
async def get_material_library(
    user: str | None = None,
    task: str | None = None,
    include_process: bool = False,
):
    return json_result(
        0,
        "success",
        _collect_material_library(
            user_account=(user or "").strip() or None,
            task_id=(task or "").strip() or None,
            include_process=include_process,
        ),
    )


@commonRouter.post("/demo/material-library/register-task")
async def register_material_task(body: MaterialTaskRegisterRequest):
    if not body.workspacePath.strip() or not body.taskId.strip():
        return json_result(1, "workspacePath and taskId are required", None)
    _register_task_meta(body)
    return json_result(0, "success", {"registered": True})


def _clear_demo_runtime_files() -> Dict:
    removed_uploads = 0
    removed_workspaces = 0

    upload_root = _resolve_upload_root()
    if os.path.isdir(upload_root):
        for name in os.listdir(upload_root):
            path = os.path.join(upload_root, name)
            if os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
                removed_uploads += 1

    workspace_root = _resolve_workspace_root()
    if os.path.isdir(workspace_root):
        for name in os.listdir(workspace_root):
            if not name.startswith("work_space"):
                continue
            path = os.path.join(workspace_root, name)
            if os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
                removed_workspaces += 1

    replay_base = os.path.join(workspace_root, "replay_history")
    if os.path.isdir(replay_base):
        shutil.rmtree(replay_base, ignore_errors=True)
        os.makedirs(replay_base, exist_ok=True)

    registry_path = _material_registry_path()
    if os.path.isfile(registry_path):
        os.remove(registry_path)

    return {
        "removedUploads": removed_uploads,
        "removedWorkspaces": removed_workspaces,
    }


@commonRouter.post("/demo/reset-runtime")
async def reset_demo_runtime():
    try:
        payload = _clear_demo_runtime_files()
        return json_result(0, "success", payload)
    except Exception as exc:
        logger.exception("reset demo runtime failed")
        return json_result(1, str(exc), None)


@commonRouter.get("/demo/audit-log")
async def get_audit_log(workspace: str | None = None):
    workspace_root = _resolve_workspace_root()
    target_workspace = (workspace or "").strip()

    if target_workspace:
        try:
            snapshot = load_execution_snapshot(workspace_root, target_workspace)
            replay_path = snapshot.get("replayFile")
            if not replay_path or not os.path.isfile(replay_path):
                return json_result(1, "replay not found", None)
            events = []
            with open(replay_path, "r", encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        events.append(json.loads(line))
                    except Exception:
                        continue
            folder_name = target_workspace.replace("\\", "/").strip("/").split("/")[-1]
            audit_log = build_audit_log(events, folder_name)
            return json_result(0, "success", audit_log)
        except FileNotFoundError:
            return json_result(1, "workspace not found", None)
        except Exception as exc:
            logger.error("audit log load failed: %s", exc)
            return json_result(1, "failed to load audit log", None)

    replay_base = os.path.join(workspace_root, "replay_history")
    if not os.path.isdir(replay_base):
        return json_result(1, "no replay history", None)

    candidates = []
    for folder_name in os.listdir(replay_base):
        replay_path = os.path.join(replay_base, folder_name, "replay.json")
        if os.path.isfile(replay_path):
            candidates.append((os.path.getmtime(replay_path), folder_name, replay_path))

    if not candidates:
        return json_result(1, "no replay records", None)

    _, folder_name, replay_path = sorted(candidates, key=lambda item: item[0])[-1]
    events = []
    with open(replay_path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except Exception:
                continue

    audit_log = build_audit_log(events, folder_name)
    return json_result(0, "success", audit_log)


@commonRouter.get("/demo/execution-snapshot")
async def get_execution_snapshot(workspace: str):
    if not workspace or not workspace.strip():
        return json_result(1, "workspace is required", None)
    try:
        snapshot = load_execution_snapshot(_resolve_workspace_root(), workspace.strip())
        return json_result(0, "success", snapshot)
    except FileNotFoundError:
        return json_result(1, "execution snapshot not found", None)
    except Exception as exc:
        logger.error("load execution snapshot failed: %s", exc)
        return json_result(1, "failed to load execution snapshot", None)


@commonRouter.post("/demo/export-document")
async def export_document(body: ExportDocumentRequest):
    try:
        export_title = body.title
        export_sections = body.sections
        execution_meta: Dict = {}

        if body.preferExecution:
            snapshot = body.executionSnapshot
            if snapshot is None and body.workspacePath:
                snapshot = load_execution_snapshot(_resolve_workspace_root(), body.workspacePath)
            if snapshot:
                export_title, export_sections = build_export_sections_from_snapshot(
                    snapshot,
                    template_id=body.templateId,
                )
                execution_meta = {
                    "workspacePath": snapshot.get("workspacePath"),
                    "stats": snapshot.get("stats"),
                    "source": snapshot.get("source", "execution"),
                }

        content, filename, media_type = build_export_file(
            template_id=body.templateId,
            export_format=body.format,
            title=export_title,
            sections=export_sections,
            execution_meta=execution_meta,
        )
    except ValueError as exc:
        return json_result(1, str(exc), None)
    except RuntimeError as exc:
        logger.error("export document failed: %s", exc)
        return json_result(1, str(exc), None)

    encoded_name = quote(filename)
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}",
            "X-LexHub-Export-Template": body.templateId,
            "X-LexHub-Export-Format": body.format,
        },
    )


@commonRouter.post("/demo/task-blueprint")
async def create_task_blueprint(body: TaskBlueprintRequest):
    scenario = body.scenario or "general_legal_workflow"
    description = (body.description or "").strip()
    if not description:
        return json_result(1, "description is required", None)

    integrations = _api_integrations()
    available_tool_names = [
        item["name"] for item in integrations
        if item["status"] in ("ready", "planned")
    ]

    return json_result(0, "success", {
        "scenario": scenario,
        "stages": _build_dynamic_blueprint(scenario, description),
        "recommendedTools": available_tool_names[:5],
        "outputTargets": [
            "事实与争议焦点摘要",
            "证据完整度与缺失材料清单",
            "法规/案例引用依据",
            "风险等级与下一步建议",
            "可导出的报告或文书草稿",
        ],
        "reviewChecklist": [
            "主体身份是否核验",
            "关键事实是否有材料支撑",
            "引用依据是否可追溯",
            "结论是否通过自动一致性校验",
            "最终材料是否归档并可回放",
        ],
    })


@commonRouter.get("/demo/admin/settings")
async def get_admin_runtime_settings():
    from cosight_server.deep_research.services.admin_runtime_config import build_admin_settings_response

    return json_result(0, "success", build_admin_settings_response(include_secrets=False))


@commonRouter.post("/demo/admin/settings")
async def save_admin_runtime_settings(body: Dict = Body(...)):
    from cosight_server.deep_research.services.admin_runtime_config import (
        build_admin_settings_response,
        save_admin_settings,
    )

    try:
        save_admin_settings(body if isinstance(body, dict) else {})
        return json_result(0, "success", build_admin_settings_response(include_secrets=False))
    except Exception as exc:
        logger.error("save admin settings failed: %s", exc)
        return json_result(1, "failed to save admin settings", None)


@commonRouter.post("/demo/admin/settings/apply")
async def apply_admin_runtime_settings():
    from cosight_server.deep_research.services.admin_runtime_config import apply_admin_runtime_config

    return json_result(0, "success", apply_admin_runtime_config())


@commonRouter.post("/demo/admin/settings/test")
async def test_admin_runtime_settings(body: Dict = Body(default={})):
    from cosight_server.deep_research.services.admin_runtime_config import test_admin_runtime_config

    try:
        payload = body if isinstance(body, dict) else {}
        incoming = {
            k: v
            for k, v in payload.items()
            if k in ("modelProviders", "modelSlots", "models", "apis", "mcpTools")
        }
        result = test_admin_runtime_config(incoming or None)
        return json_result(0, "success", result)
    except Exception as exc:
        logger.error("admin settings test failed: %s", exc)
        return json_result(1, str(exc), None)
