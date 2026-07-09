import { buildApiUrl, generateDocumentViaApi } from './api';
import type { DocumentExportFormat, DocumentSection, DocumentTemplateId, ExportDocumentPayload } from '../types/export';
import type { ExecutionSnapshot } from '../types/execution';
import type { ResultInsight } from '../types/chat';
import { buildCaseFactsFromSnapshot, buildExportPayloadFromSnapshot, buildExecutionSnapshotFromChat } from './execution-export';
import { parseMarkdownSections } from './report-parser';

const EXPORT_DOCUMENT_API_PATH = '/api/nae-deep-research/v1/demo/export-document';

function parseFileName(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function parseExportError(response: Response): Promise<string> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) return data.message;
    } catch {
      // Fall through to generic message.
    }
  }
  return `导出失败（HTTP ${response.status}）`;
}

function downloadBase64File(contentBase64: string, fileName: string, mediaType: string) {
  const binary = atob(contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  downloadBlob(new Blob([bytes], { type: mediaType }), fileName);
}

async function requestDocumentExport(payload: ExportDocumentPayload): Promise<string> {
  const response = await fetch(buildApiUrl(EXPORT_DOCUMENT_API_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseExportError(response));
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    throw new Error(await parseExportError(response));
  }

  const blob = await response.blob();
  const fileName = parseFileName(response.headers.get('Content-Disposition'))
    ?? `lexhub-${payload.templateId}.${payload.format}`;
  downloadBlob(blob, fileName);
  return fileName;
}

function resolveCaseFacts(payload: ExportDocumentPayload): string {
  if (payload.caseFacts?.trim()) return payload.caseFacts.trim();
  if (payload.sections?.length) {
    return payload.sections.map((section) => `## ${section.title}\n${section.body}`).join('\n\n');
  }
  if (payload.executionSnapshot) {
    return buildCaseFactsFromSnapshot(payload.executionSnapshot);
  }
  return payload.title?.trim() || '请根据当前法律事项生成文书草稿。';
}

async function generateAndExportDocument(payload: ExportDocumentPayload): Promise<string> {
  const result = await generateDocumentViaApi({
    templateId: payload.templateId,
    caseFacts: resolveCaseFacts(payload),
    extraInstructions: payload.extraInstructions,
    useResearch: payload.useResearch ?? true,
    exportFormat: payload.format,
  });
  if (!result) throw new Error('文书生成失败，请检查文书生成服务配置。');

  const exportInfo = result.export as { filename?: string; mediaType?: string; contentBase64?: string } | undefined;
  if (exportInfo?.contentBase64 && exportInfo.filename) {
    downloadBase64File(exportInfo.contentBase64, exportInfo.filename, exportInfo.mediaType || 'application/octet-stream');
    return exportInfo.filename;
  }

  const title = String(result.title || payload.title || `lexhub-${payload.templateId}`);
  const sections = (result.sections as Array<{ title: string; body: string }> | undefined) ?? [];
  return requestDocumentExport({
    templateId: payload.templateId,
    format: payload.format,
    title,
    sections,
    preferExecution: false,
    generationMode: 'template',
  });
}

export async function exportDocument(payload: ExportDocumentPayload): Promise<string> {
  const mode = payload.generationMode ?? (payload.preferExecution === false ? 'template' : 'execution');
  if (mode === 'llm') {
    return generateAndExportDocument(payload);
  }

  return requestDocumentExport(payload);
}

export async function exportMarkdownUrlAsDocument(input: {
  url: string;
  name: string;
  kind: 'generated' | 'report';
  format: DocumentExportFormat;
}): Promise<string> {
  const response = await fetch(input.url);
  if (!response.ok) {
    throw new Error(`读取原文失败（HTTP ${response.status}）`);
  }
  const markdown = await response.text();
  const title = input.name.replace(/\.[^.]+$/, '').trim() || 'LexHub 交付物';
  const sections = parseMarkdownSections(markdown).map((section) => ({
    title: section.title,
    body: section.body,
  }));

  return exportDocument({
    templateId: input.kind === 'report' ? 'task_summary_report' : resolveTemplateId(title),
    format: input.format,
    title,
    sections,
    preferExecution: false,
    generationMode: 'template',
  });
}

export function buildReportExportPayload(
  format: DocumentExportFormat,
  title: string,
  sections: Array<{ title: string; desc: string }>,
  snapshot?: ExecutionSnapshot | null,
  resultInsight?: ResultInsight,
): ExportDocumentPayload {
  if (snapshot) {
    return buildExportPayloadFromSnapshot(snapshot, 'task_summary_report', format, resultInsight);
  }
  return {
    templateId: 'task_summary_report',
    format,
    title,
    sections: sections.map((section) => ({
      title: section.title,
      body: section.desc,
    })),
    preferExecution: false,
  };
}

export function buildLiveExportPayload(input: {
  templateId: DocumentTemplateId;
  format: DocumentExportFormat;
  messages: import('../types/chat').ChatMessage[];
  steps: import('../types/chat').AgentStep[];
  toolCalls: import('../types/chat').ToolCallTrace[];
  resultInsight: ResultInsight;
  workspacePath?: string;
}): ExportDocumentPayload {
  const snapshot = buildExecutionSnapshotFromChat({
    messages: input.messages,
    steps: input.steps,
    toolCalls: input.toolCalls,
    resultInsight: input.resultInsight,
    workspacePath: input.workspacePath,
  });
  return buildExportPayloadFromSnapshot(
    snapshot,
    input.templateId,
    input.format,
    input.resultInsight,
  );
}

export function buildWorkspaceExportPayload(
  snapshot: ExecutionSnapshot,
  templateId: DocumentTemplateId,
  format: DocumentExportFormat,
): ExportDocumentPayload {
  return {
    templateId,
    format,
    workspacePath: snapshot.workspacePath,
    executionSnapshot: snapshot,
    preferExecution: true,
  };
}

export function resolveTemplateId(label: string): DocumentTemplateId {
  const map: Record<string, DocumentTemplateId> = {
    合同审查报告: 'contract_review_report',
    商业合同起草: 'commercial_contract_draft',
    商业合同草稿: 'commercial_contract_draft',
    条款修改备忘: 'clause_revision_memo',
    律师函初稿: 'lawyer_letter_draft',
    合同争议律师函: 'lawyer_letter_draft',
    法律意见摘要: 'legal_opinion_summary',
    证据清单: 'evidence_checklist',
  };
  return map[label] ?? 'contract_review_report';
}

export type { DocumentSection, DocumentTemplateId };
