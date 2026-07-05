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

  const handleExport = async () => {
    setLoading(true);
    try {
      const fileName = await exportDocument(payload);
      onSuccess?.(fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      onError?.(message);
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className={className} onClick={() => void handleExport()} disabled={loading}>
      {loading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
      {label ?? (payload.generationMode === 'llm' ? `AI 生成 ${payload.format.toUpperCase()}` : `导出 ${payload.format.toUpperCase()}`)}
    </button>
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
