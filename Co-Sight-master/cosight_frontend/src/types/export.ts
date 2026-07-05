import type { ExecutionSnapshot } from './execution';

export type DocumentTemplateId =
  | 'contract_review_report'
  | 'commercial_contract_draft'
  | 'clause_revision_memo'
  | 'lawyer_letter_draft'
  | 'legal_opinion_summary'
  | 'evidence_checklist'
  | 'task_summary_report';

export type DocumentExportFormat = 'docx' | 'pdf';

export type DocumentGenerationMode = 'template' | 'execution' | 'llm';

export type DocumentSection = {
  title: string;
  body: string;
};

export type ExportDocumentPayload = {
  templateId: DocumentTemplateId;
  format: DocumentExportFormat;
  title?: string;
  sections?: DocumentSection[];
  workspacePath?: string;
  executionSnapshot?: ExecutionSnapshot;
  preferExecution?: boolean;
  /** llm = 调用后端 LLM API 生成；execution = 导出真实执行记录；template = 静态模板 */
  generationMode?: DocumentGenerationMode;
  caseFacts?: string;
  useResearch?: boolean;
  extraInstructions?: string;
};

export const DOCUMENT_TEMPLATE_MAP: Record<string, DocumentTemplateId> = {
  合同审查报告: 'contract_review_report',
  商业合同起草: 'commercial_contract_draft',
  商业合同草稿: 'commercial_contract_draft',
  条款修改备忘: 'clause_revision_memo',
  律师函初稿: 'lawyer_letter_draft',
  合同争议律师函: 'lawyer_letter_draft',
  法律意见摘要: 'legal_opinion_summary',
  证据清单: 'evidence_checklist',
  合同审查任务总结报告: 'task_summary_report',
};
