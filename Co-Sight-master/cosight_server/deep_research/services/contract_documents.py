"""合同文书生成 — 基于 LLM + 法规/模板检索，不依赖外部合同 SaaS。"""

from __future__ import annotations

from typing import Any

from cosight_server.deep_research.services.document_generator import TEMPLATE_SCHEMAS, generate_document_via_llm
from cosight_server.deep_research.services.document_research import build_document_research_context
from cosight_server.deep_research.services.legal_kb.legal_search import hybrid_legal_search

CONTRACT_TEMPLATE_IDS = frozenset(
    {
        "contract_review_report",
        "commercial_contract_draft",
        "clause_revision_memo",
        "lawyer_letter_draft",
    }
)

CONTRACT_DOCUMENT_CATALOG: list[dict[str, Any]] = [
    {
        "id": "contract_review_report",
        "label": "合同审查报告",
        "description": "针对已有合同文本，输出条款风险分级与修改建议。",
        "category": "审查",
        "recommended": True,
    },
    {
        "id": "commercial_contract_draft",
        "label": "商业合同起草",
        "description": "根据甲乙方、标的与关键条款生成可继续谈判的合同正文草稿。",
        "category": "起草",
        "recommended": True,
    },
    {
        "id": "clause_revision_memo",
        "label": "条款修改备忘",
        "description": "对照原条款给出逐条修改建议与谈判要点，便于发函或批注。",
        "category": "修订",
        "recommended": False,
    },
    {
        "id": "lawyer_letter_draft",
        "label": "合同争议律师函",
        "description": "围绕合同履行争议生成律师函初稿。",
        "category": "争议",
        "recommended": False,
    },
]


def build_contract_case_facts(
    *,
    contract_type: str = "",
    party_a: str = "",
    party_b: str = "",
    subject_matter: str = "",
    key_clauses: str = "",
    contract_excerpt: str = "",
    material_notes: str = "",
    user_goal: str = "",
) -> str:
    lines: list[str] = []
    if user_goal.strip():
        lines.append(f"用户目标：{user_goal.strip()}")
    if contract_type.strip():
        lines.append(f"合同类型：{contract_type.strip()}")
    if party_a.strip() or party_b.strip():
        lines.append(f"甲方：{party_a.strip() or '【待补充】'}")
        lines.append(f"乙方：{party_b.strip() or '【待补充】'}")
    if subject_matter.strip():
        lines.append(f"标的/合作内容：{subject_matter.strip()}")
    if key_clauses.strip():
        lines.append(f"关注/拟约定条款：{key_clauses.strip()}")
    if contract_excerpt.strip():
        lines.append("=== 合同原文摘录 ===")
        lines.append(contract_excerpt.strip())
    if material_notes.strip():
        lines.append("=== 材料与背景补充 ===")
        lines.append(material_notes.strip())
    return "\n".join(lines).strip()


def _fetch_template_hints(contract_type: str, key_clauses: str, *, limit: int = 4) -> list[dict[str, Any]]:
    query_parts = [part for part in (contract_type, key_clauses, "合同") if part and part.strip()]
    query = " ".join(query_parts)[:120] or "合同模板"
    data = hybrid_legal_search(query, limit=limit)
    hints: list[dict[str, Any]] = []
    index = 1
    for hit in data.get("templates") or []:
        title = str(hit.get("title") or hit.get("id") or f"模板{index}").strip()
        content = str(hit.get("content") or hit.get("summary") or "").strip()
        if not content:
            continue
        hints.append(
            {
                "ref_id": f"模板{index}",
                "title": title[:200],
                "content": content[:900],
                "source": hit.get("source") or "文书模板库",
                "source_url": hit.get("source_url") or hit.get("url") or "",
                "bucket": "templates",
            }
        )
        index += 1
        if len(hints) >= limit:
            break
    return hints


def generate_contract_document(
    *,
    template_id: str,
    contract_type: str = "",
    party_a: str = "",
    party_b: str = "",
    subject_matter: str = "",
    key_clauses: str = "",
    contract_excerpt: str = "",
    material_notes: str = "",
    user_goal: str = "",
    extra_instructions: str = "",
    use_research: bool = True,
) -> dict[str, Any]:
    if template_id not in CONTRACT_TEMPLATE_IDS:
        raise ValueError(f"不支持的合同文书类型: {template_id}")

    case_facts = build_contract_case_facts(
        contract_type=contract_type,
        party_a=party_a,
        party_b=party_b,
        subject_matter=subject_matter,
        key_clauses=key_clauses,
        contract_excerpt=contract_excerpt,
        material_notes=material_notes,
        user_goal=user_goal,
    )
    if not case_facts:
        raise ValueError("请至少填写合同类型、主体、条款或合同原文摘录中的一项")

    research_context: list[dict[str, Any]] = []
    template_hints: list[dict[str, Any]] = []
    if use_research:
        research_context = build_document_research_context(case_facts, limit_per_query=4)
        template_hints = _fetch_template_hints(contract_type, key_clauses)

    merged_context = research_context + template_hints
    instructions = extra_instructions.strip()
    if template_hints:
        instructions = (
            f"{instructions}\n\n"
            "写作提示：可参考「模板依据」中的结构，但不得照搬与本案不符的条款；"
            "缺信息处标注【待补充】。"
        ).strip()

    generated = generate_document_via_llm(
        template_id=template_id,
        case_facts=case_facts,
        extra_instructions=instructions,
        research_context=merged_context,
    )
    return {
        **generated,
        "caseFacts": case_facts,
        "researchUsed": len(research_context),
        "templateHintsUsed": len(template_hints),
        "catalogLabel": next(
            (item["label"] for item in CONTRACT_DOCUMENT_CATALOG if item["id"] == template_id),
            TEMPLATE_SCHEMAS.get(template_id, {}).get("display_name", template_id),
        ),
    }
