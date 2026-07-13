import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportDocument } from '../../lib/document-export';
import type { DocumentExportFormat, ExportDocumentPayload } from '../../types/export';

type DocumentExportButtonProps = {
  payload: ExportDocumentPayload;
  label?: string;
  className?: string;
  onSuccess?: (fileName: string) => void;
  onError?: (message: string) => void;
};

function DocumentExportButton({
  payload,
  label,
  className = 'btn btn-secondary',
  onSuccess,
  onError,
}: DocumentExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const fileName = await exportDocument(payload);
      onSuccess?.(fileName);
      setFeedback({ tone: 'success', text: `已生成 ${fileName}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      onError?.(message);
      setFeedback({ tone: 'error', text: `${message}，可重新尝试` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="document-export-control">
      <button type="button" className={className} onClick={() => void handleExport()} disabled={loading} aria-busy={loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
        {loading ? '正在生成…' : label ?? (payload.generationMode === 'llm' ? `AI 生成 ${payload.format.toUpperCase()}` : `导出 ${payload.format.toUpperCase()}`)}
      </button>
      {feedback ? <small className={feedback.tone} role={feedback.tone === 'error' ? 'alert' : 'status'} aria-live="polite">{feedback.text}</small> : null}
    </span>
  );
}

export function buildFormatButtons(
  base: Omit<ExportDocumentPayload, 'format'>,
  formats: DocumentExportFormat[] = ['docx', 'pdf'],
) {
  return formats.map((format) => ({
    format,
    payload: { ...base, format },
  }));
}

export default DocumentExportButton;
