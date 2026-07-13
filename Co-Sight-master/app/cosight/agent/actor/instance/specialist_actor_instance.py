from __future__ import annotations

import re
from typing import Callable

from app.agent_dispatcher.infrastructure.entity.AgentInstance import AgentInstance
from app.agent_dispatcher.infrastructure.entity.AgentTemplate import AgentTemplate
from app.cosight.agent.actor.instance.actor_agent_skill import (
    ask_question_about_image_skill,
    contract_compare_skill,
    create_html_report_skill,
    execute_code_skill,
    extract_document_content_skill,
    fetch_website_content_skill,
    file_find_in_content_skill,
    file_read_skill,
    file_saver_skill,
    file_str_replace_skill,
    legal_search_skill,
    mark_step_skill,
    search_google_skill,
    search_wiki_skill,
    tavily_search_skill,
)


SPECIALIST_DEFINITIONS = {
    "evidence": {
        "name_zh": "材料证据智能体",
        "name_en": "Evidence Agent",
        "description": "负责材料解析、OCR、事实抽取、证据定位和缺口识别。",
        "prompt": "你是材料证据智能体。只处理材料读取、OCR、事实提取、来源定位和证据缺口；不要自行扩展法律结论。输出应注明文件与页码/段落来源。",
        "skills": lambda workspace: [mark_step_skill(), file_read_skill(), file_find_in_content_skill(), extract_document_content_skill(), ask_question_about_image_skill(), file_saver_skill()],
    },
    "issue_spotter": {
        "name_zh": "法律争点智能体",
        "name_en": "Legal Issue Spotter",
        "description": "负责法律关系、争议焦点和请求权基础识别。",
        "prompt": "你是法律争点智能体。基于已有事实识别法律关系、争议焦点、请求权基础和待检索问题；不执行无关联网搜索，不虚构事实。",
        "skills": lambda workspace: [mark_step_skill(), file_read_skill(), file_find_in_content_skill(), file_saver_skill()],
    },
    "research": {
        "name_zh": "法规研究智能体",
        "name_en": "Legal Research Agent",
        "description": "负责法规、司法解释、案例和知识库检索。",
        "prompt": "你是法规研究智能体。围绕明确争点检索有效法律依据，区分法规、案例和普通网页，保留标题、来源与可核验引用；达到证据覆盖后立即结束。",
        "skills": lambda workspace: [mark_step_skill(), legal_search_skill(), search_google_skill(), tavily_search_skill(), search_wiki_skill(), fetch_website_content_skill(), file_read_skill(), file_saver_skill()],
    },
    "clause_risk": {
        "name_zh": "条款风险智能体",
        "name_en": "Clause Risk Agent",
        "description": "负责合同条款分类、缺失条款、版本差异和修改建议。",
        "prompt": "你是条款风险智能体。只分析合同条款风险、缺失条款、权利义务失衡和版本差异；建议必须指向具体条款，不泛化为普通法律咨询。",
        "skills": lambda workspace: [mark_step_skill(), file_read_skill(), file_find_in_content_skill(), contract_compare_skill(), file_saver_skill()],
    },
    "calculation": {
        "name_zh": "时效计算智能体",
        "name_en": "Legal Calculation Agent",
        "description": "负责时效、期限、利息、违约金和时间线计算。",
        "prompt": "你是时效计算智能体。所有日期、金额、利息和期限必须展示输入参数、公式、计算过程和结果；缺少参数时明确列出假设。",
        "skills": lambda workspace: [mark_step_skill(), file_read_skill(), execute_code_skill(workspace), file_saver_skill()],
    },
    "drafting": {
        "name_zh": "文书生成智能体",
        "name_en": "Legal Drafting Agent",
        "description": "负责依据阶段成果生成报告、律师函和合同文书。",
        "prompt": "你是文书生成智能体。只依据已有事实、研究和计算成果起草正式文书；结论必须对应来源，不重新进行广泛检索。仅保存最终文书。",
        "skills": lambda workspace: [mark_step_skill(), file_read_skill(), file_saver_skill(), file_str_replace_skill(), create_html_report_skill()],
    },
    "verification": {
        "name_zh": "质量校验智能体",
        "name_en": "Verification Agent",
        "description": "负责事实、引用、金额、结构和最终一致性校验。",
        "prompt": "你是质量校验智能体。检查事实一致性、引用匹配、金额日期和文书完整度；输出通过或具体修正项。不要重新执行完整研究。",
        "skills": lambda workspace: [mark_step_skill(), file_read_skill(), file_find_in_content_skill(), execute_code_skill(workspace), file_saver_skill()],
    },
}


def create_specialist_actor_instance(agent_id: str, instance_name: str, workspace_path: str) -> AgentInstance:
    definition = SPECIALIST_DEFINITIONS.get(agent_id)
    if definition is None:
        raise ValueError(f"Unknown specialist agent: {agent_id}")
    template = AgentTemplate(**{
        "template_name": f"lexhub_{agent_id}_template",
        "template_version": "v1",
        "agent_type": f"lexhub_{agent_id}_agent",
        "display_name_zh": definition["name_zh"],
        "display_name_en": definition["name_en"],
        "description_zh": definition["description"],
        "description_en": definition["description"],
        "profile": [],
        "service_name": "lexhub_execution_service",
        "service_version": "v1",
        "default_replay_zh": definition["name_zh"],
        "default_replay_en": definition["name_en"],
        "icon": "",
        "skills": definition["skills"](workspace_path),
        "organizations": [],
        "knowledge": [],
        "max_iteration": 20,
        "business_type": {"agent_id": agent_id, "specialist_prompt_zh": definition["prompt"]},
    })
    return AgentInstance(**{
        "instance_id": f"{agent_id}_{instance_name}",
        "instance_name": f"{definition['name_en']} · {instance_name}",
        "template_name": template.template_name,
        "template_version": "v1",
        "display_name_zh": definition["name_zh"],
        "display_name_en": definition["name_en"],
        "description_zh": definition["description"],
        "description_en": definition["description"],
        "service_name": "lexhub_execution_service",
        "service_version": "v1",
        "template": template,
    })


def infer_agent_id(step_title: str) -> str:
    text = (step_title or "").lower()
    rules = (
        ("evidence", r"证据|材料|ocr|文档解析|事实提取|evidence"),
        ("issue_spotter", r"争点|法律关系|请求权|需求分析|任务理解|issue"),
        ("research", r"法规|法条|案例|检索|研究|依据|research"),
        ("clause_risk", r"条款|合同风险|版本比对|续签|clause"),
        ("calculation", r"利息|金额|时效|期限|赔偿|违约金|计算|calculation"),
        ("drafting", r"文书|报告|律师函|起草|生成|交付|draft"),
        ("verification", r"审查|复核|校验|质检|合规|归档|verification|review"),
    )
    for agent_id, pattern in rules:
        if re.search(pattern, text):
            return agent_id
    return "issue_spotter"


def resolve_step_agent_id(plan, step_index: int) -> str:
    explicit = getattr(plan, "step_agent_ids", None)
    if isinstance(explicit, dict):
        value = explicit.get(step_index) or explicit.get(str(step_index))
        if value in SPECIALIST_DEFINITIONS:
            return value
    title = plan.steps[step_index] if plan and 0 <= step_index < len(plan.steps) else ""
    return infer_agent_id(title)
