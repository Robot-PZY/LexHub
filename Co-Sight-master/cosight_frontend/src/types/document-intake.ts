import type { DocumentTemplateId } from './export';

export type DocumentIntake = {
  templateId: DocumentTemplateId;
  templateLabel: string;
  contractType: string;
  partyA: string;
  partyB: string;
  subjectMatter: string;
  keyClauses: string;
  contractExcerpt: string;
  materialNotes: string;
  userGoal: string;
  extraInstructions: string;
};

export const EMPTY_DOCUMENT_INTAKE: DocumentIntake = {
  templateId: 'contract_review_report',
  templateLabel: '',
  contractType: '',
  partyA: '',
  partyB: '',
  subjectMatter: '',
  keyClauses: '',
  contractExcerpt: '',
  materialNotes: '',
  userGoal: '',
  extraInstructions: '',
};

const CONTRACT_TEMPLATE_IDS = new Set<DocumentTemplateId>([
  'contract_review_report',
  'commercial_contract_draft',
  'clause_revision_memo',
  'lawyer_letter_draft',
]);

export function isContractTemplate(templateId: DocumentTemplateId): boolean {
  return CONTRACT_TEMPLATE_IDS.has(templateId);
}

export function validateDocumentIntake(intake: DocumentIntake, taskDraft: string): string | null {
  if (!intake.templateId) return '请选择目标文书类型';
  const hasStructured = Boolean(
    intake.contractType.trim()
    || intake.partyA.trim()
    || intake.partyB.trim()
    || intake.keyClauses.trim()
    || intake.contractExcerpt.trim()
    || intake.subjectMatter.trim()
    || intake.materialNotes.trim()
    || intake.userGoal.trim(),
  );
  if (!hasStructured && !taskDraft.trim()) {
    return '请填写文书关键信息，或在下方补充任务描述';
  }
  return null;
}

export function buildIntakeContextBlock(intake: DocumentIntake): string {
  const lines: string[] = ['【文书生成参数】'];
  if (intake.templateLabel) lines.push(`目标文书：${intake.templateLabel}`);
  if (intake.userGoal.trim()) lines.push(`生成目标：${intake.userGoal.trim()}`);
  if (intake.contractType.trim()) lines.push(`合同类型：${intake.contractType.trim()}`);
  if (intake.partyA.trim() || intake.partyB.trim()) {
    lines.push(`甲方：${intake.partyA.trim() || '【待补充】'}`);
    lines.push(`乙方：${intake.partyB.trim() || '【待补充】'}`);
  }
  if (intake.subjectMatter.trim()) lines.push(`标的/合作内容：${intake.subjectMatter.trim()}`);
  if (intake.keyClauses.trim()) lines.push(`关注条款：${intake.keyClauses.trim()}`);
  if (intake.contractExcerpt.trim()) {
    lines.push('合同原文摘录：');
    lines.push(intake.contractExcerpt.trim());
  }
  if (intake.materialNotes.trim()) lines.push(`补充背景：${intake.materialNotes.trim()}`);
  if (intake.extraInstructions.trim()) lines.push(`写作要求：${intake.extraInstructions.trim()}`);
  return lines.join('\n');
}

export function mergeIntakeWithSnapshotFacts(intake: DocumentIntake, snapshotFacts: string): DocumentIntake {
  const mergedNotes = [intake.materialNotes.trim(), snapshotFacts.trim()].filter(Boolean).join('\n\n');
  return { ...intake, materialNotes: mergedNotes };
}
