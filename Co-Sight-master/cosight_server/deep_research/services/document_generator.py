"""文书生成 — 通过 LLM API 生成，本地仅负责导出。"""

from __future__ import annotations

import re
from typing import Any

from app.common.logger_util import logger
from cosight_server.deep_research.services.document_research import format_research_context_for_prompt

TEMPLATE_SCHEMAS: dict[str, dict[str, Any]] = {
    "contract_review_report": {
        "display_name": "合同审查报告",
        "sections": [
            ("一、任务背景", "说明审查对象、合同类型、审查目的与材料范围；引用任务事实中的关键信息。"),
            ("二、主体与材料核验", "列明合同主体、签署情况；已收/缺失材料用条目列出，缺失处标注【待补充】。"),
            ("三、重点条款与风险分析", "针对付款、交付、违约、解除、争议解决等条款逐条分析，风险分级（高/中/低）。"),
            ("四、法规与研究依据", "结合 [依据N] 说明法律依据；无充分依据时写明需进一步检索。"),
            ("五、审查意见与修改建议", "给出可操作建议与条款修改方向，避免空泛结论。"),
            ("六、自动质量校验", "说明核验智能体对事实、依据、引用与输出一致性的检查结果。"),
        ],
    },
    "lawyer_letter_draft": {
        "display_name": "律师函初稿",
        "sections": [
            ("致送对象", "对方当事人名称/地址；未知则写【待补充】。"),
            ("事由", "一句话概括争议主题。"),
            ("事实概述", "按时间线叙述关键事实，与任务材料一致，不臆造细节。"),
            ("法律意见", "结合 [依据N] 说明权利基础；无依据则写初步法律判断并标注需核验。"),
            ("具体要求", "列明要求在合理期限内履行的具体事项。"),
            ("声明与落款", "保留律师署名、日期、联系方式等占位【待补充】。"),
        ],
    },
    "legal_opinion_summary": {
        "display_name": "法律意见摘要",
        "sections": [
            ("咨询事项", "概括客户问题与适用范围。"),
            ("主要结论", "3–5 条结论，结论后附 [依据N] 或【需补充依据】。"),
            ("关键风险", "列出主要法律风险及触发条件。"),
            ("建议措施", "可执行的下一步（补证、谈判、诉讼准备等）。"),
        ],
    },
    "evidence_checklist": {
        "display_name": "证据清单",
        "sections": [
            ("已收集材料", "编号列出已有证据及证明目的。"),
            ("缺失材料", "列出尚缺证据及对案件影响。"),
            ("待核验事项", "主体、签署、时间线等待核实项。"),
            ("归档说明", "与 Co-Sight 执行记录/工作区的关联说明。"),
        ],
    },
    "task_summary_report": {
        "display_name": "任务处理摘要",
        "sections": [
            ("任务目标", "复述用户诉求与任务范围。"),
            ("处理过程", "按 Co-Sight 阶段概述执行路径与工具使用。"),
            ("主要发现", "归纳事实认定、法规检索与风险点。"),
            ("下一步建议", "给出可跟进的行动项。"),
        ],
    },
    "commercial_contract_draft": {
        "display_name": "商业合同草稿",
        "sections": [
            ("合同标题", "写明合同名称与编号占位【待补充】。"),
            ("当事人", "列明甲方、乙方名称、住所与联系方式；未知写【待补充】。"),
            ("鉴于条款", "简述合作背景与签约目的，不臆造不存在的事实。"),
            ("定义与解释", "对关键术语作必要定义。"),
            ("标的与内容", "描述服务/货物/合作范围、交付标准与验收方式。"),
            ("价款与支付", "金额、支付方式、发票、逾期责任；未知写【待补充】。"),
            ("履行期限与地点", "起止时间、里程碑或交付节点。"),
            ("权利义务", "双方主要义务、保密、知识产权归属（如适用）。"),
            ("违约责任", "违约情形、违约金或损失赔偿计算方式，避免过度绝对化表述。"),
            ("解除与终止", "约定解除条件与善后安排。"),
            ("争议解决", "管辖/仲裁约定；可引用 [依据N] 说明常见做法。"),
            ("其他", "通知送达、不可抗力、合同份数等。"),
            ("签署页", "留白：甲方（盖章）乙方（盖章）日期。"),
            ("起草说明", "列出【待补充】项与谈判时需重点确认的 3–5 条。"),
        ],
    },
    "clause_revision_memo": {
        "display_name": "条款修改备忘",
        "sections": [
            ("背景说明", "合同类型、审查目的与对方立场简述。"),
            ("总体评价", "对合同整体风险与谈判优先级给出 3–5 条结论。"),
            ("逐条修改建议", "按条款编号列出：原条款摘要 → 风险点 → 建议表述 → 谈判话术要点。"),
            ("缺失条款建议", "建议补充的条款（如保密、知产、数据合规等）。"),
            ("法规依据摘要", "结合 [依据N] 说明主要法律依据；无则标注需补充检索。"),
            ("自动质量校验", "本备忘由核验智能体完成事实、依据与表述一致性检查。"),
        ],
    },
}


def _parse_sections(markdown: str) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []
    current_title = "正文"
    current_body: list[str] = []

    for line in markdown.splitlines():
        heading = re.match(r"^#{1,3}\s+(.+)$", line.strip())
        if heading:
            if current_body:
                sections.append({"title": current_title, "body": "\n".join(current_body).strip()})
            current_title = heading.group(1).strip()
            current_body = []
        else:
            current_body.append(line)
    if current_body:
        sections.append({"title": current_title, "body": "\n".join(current_body).strip()})
    return [item for item in sections if item["body"]]


def _extract_llm_text(response: Any) -> str:
    if response is None:
        return ""
    if isinstance(response, str):
        return response.strip()
    choices = getattr(response, "choices", None)
    if choices:
        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", None) if message else None
        if content:
            return str(content).strip()
    if isinstance(response, dict):
        return str(response.get("content") or response.get("text") or "").strip()
    return str(response).strip()


def _build_section_outline(template_id: str) -> str:
    schema = TEMPLATE_SCHEMAS.get(template_id)
    if not schema:
        return "请按专业法律文书结构分章节输出，使用 ## 作为章节标题。"
    lines = [f"文书类型：{schema['display_name']}", "必须包含以下章节（标题保持一致，内容充实）：", ""]
    for title, hint in schema["sections"]:
        lines.append(f"## {title}")
        lines.append(f"（写作要求：{hint}）")
        lines.append("")
    return "\n".join(lines)


def _align_sections(parsed: list[dict[str, str]], template_id: str) -> list[dict[str, str]]:
    schema = TEMPLATE_SCHEMAS.get(template_id)
    if not schema or not parsed:
        return parsed

    expected = [title for title, _ in schema["sections"]]
    by_title = {item["title"].strip(): item for item in parsed}
    aligned: list[dict[str, str]] = []
    used: set[str] = set()

    for title in expected:
        if title in by_title:
            aligned.append(by_title[title])
            used.add(title)
            continue
        for key, item in by_title.items():
            if key in used:
                continue
            if title[:4] in key or key[:4] in title:
                aligned.append({"title": title, "body": item["body"]})
                used.add(key)
                break
        else:
            aligned.append({"title": title, "body": "【待补充】本节将在补充案件材料后由核验智能体自动完善。"})

    for item in parsed:
        if item["title"] not in used:
            aligned.append(item)
    return aligned


def generate_document_via_llm(
    *,
    template_id: str,
    case_facts: str,
    extra_instructions: str = "",
    research_context: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    from llm import llm_for_act

    outline = _build_section_outline(template_id)
    citations = format_research_context_for_prompt(research_context or [])

    system_prompt = (
        "你是律枢 LexHub 资深法律文书助理。请根据事实与检索依据撰写专业、克制、可复核的中文法律文书草稿。\n"
        "硬性规则：\n"
        "1. 不得捏造法条条文号、案例案号或事实细节；不确定处使用【待补充】。\n"
        "2. 引用检索依据时必须在句末标注 [依据N]，且 N 必须来自依据清单。\n"
        "3. 避免空洞套话，每条结论尽量对应事实或依据。\n"
        "4. 使用 Markdown，章节标题统一为 ## 二级标题。\n"
        "5. 语言风格：正式、简洁，适合律师内部审稿。"
    )
    user_prompt = (
        f"{outline}\n\n"
        f"=== 案件/任务事实 ===\n{case_facts.strip()}\n\n"
        f"=== 法规与研究依据 ===\n{citations}\n\n"
        f"=== 补充说明 ===\n{extra_instructions.strip() or '无'}\n\n"
        "请直接输出完整文书正文，不要输出思考过程。"
    )

    try:
        response = llm_for_act.chat_to_llm(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=6000,
        )
        content = _extract_llm_text(response)
    except Exception as exc:
        logger.error("LLM document generation failed: %s", exc)
        raise RuntimeError(f"文书生成 API 调用失败: {exc}") from exc

    sections = _align_sections(_parse_sections(content or ""), template_id)
    if not sections:
        sections = [{"title": "生成结果", "body": content or "生成失败，请重试。"}]

    schema = TEMPLATE_SCHEMAS.get(template_id, {})
    title = f"{schema.get('display_name', template_id)}"
    if case_facts.strip():
        first_line = case_facts.strip().split("\n", 1)[0][:40]
        if first_line.startswith("任务："):
            title = f"{first_line.replace('任务：', '').strip()} · {title}"

    return {
        "templateId": template_id,
        "title": title,
        "sections": sections,
        "rawMarkdown": content,
        "engine": "llm_api",
        "model": getattr(llm_for_act, "model", "unknown"),
        "researchCitations": [
            {"refId": item.get("ref_id"), "title": item.get("title"), "source": item.get("source")}
            for item in (research_context or [])
        ],
    }
