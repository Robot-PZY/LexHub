import { useMemo } from 'react';
import DocumentExportButton from './DocumentExportButton';
import type { DocumentExportFormat, ExportDocumentPayload } from '../../types/export';

type ExecutionExportActionsProps = {
  payload: ExportDocumentPayload | null;
  formats?: DocumentExportFormat[];
  className?: string;
  onSuccess?: (fileName: string) => void;
  hint?: string;
};

function ExecutionExportActions({
  payload,
  formats = ['docx', 'pdf'],
  className,
  onSuccess,
  hint,
}: ExecutionExportActionsProps) {
  const sourceLabel = useMemo(() => {
    if (!payload) return '暂无执行数据';
    if (payload.generationMode === 'llm') return 'LLM API 生成';
    if (payload.executionSnapshot || payload.workspacePath || payload.preferExecution) {
      return 'Co-Sight 真实执行';
    }
    return 'Demo 模板';
  }, [payload]);

  if (!payload) {
    return <span className="execution-export-empty">{hint ?? '完成一次任务后可导出真实执行记录。'}</span>;
  }

  return (
    <div className={`execution-export-actions ${className ?? ''}`}>
      <span className={`ds-badge ${payload.preferExecution !== false ? 'ds-badge-success' : 'ds-badge-primary'}`}>
        {sourceLabel}
      </span>
      {formats.map((format) => (
        <DocumentExportButton
          key={format}
          payload={{ ...payload, format }}
          label={`导出 ${format.toUpperCase()}`}
          onSuccess={onSuccess}
        />
      ))}
    </div>
  );
}

export function buildTemplatePayload(
  base: Omit<ExportDocumentPayload, 'format'>,
  formats: DocumentExportFormat[] = ['docx', 'pdf'],
) {
  return formats.map((format) => ({ format, payload: { ...base, format } }));
}

export default ExecutionExportActions;
