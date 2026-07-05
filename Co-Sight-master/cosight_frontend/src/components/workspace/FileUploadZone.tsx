import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadFiles } from '../../lib/api';
import type { UploadedFileInfo } from '../../lib/chat';

type FileUploadZoneProps = {
  files: UploadedFileInfo[];
  onChange: (files: UploadedFileInfo[]) => void;
  compact?: boolean;
  collapsible?: boolean;
  hint?: string;
  uploadMeta?: { userAccount?: string; taskId?: string; taskTitle?: string };
};

function FileUploadZone({
  files,
  onChange,
  compact = false,
  collapsible = true,
  hint,
  uploadMeta,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(!collapsible);

  const handleUpload = async (list: File[]) => {
    if (list.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await uploadFiles(list, uploadMeta);
      onChange([...files, ...uploaded]);
      setExpanded(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '材料上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    if (!list || list.length === 0) return;
    await handleUpload(Array.from(list));
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const list = Array.from(event.dataTransfer.files);
    await handleUpload(list);
  };

  const removeFile = (filename: string) => {
    onChange(files.filter((item) => item.filename !== filename));
  };

  if (collapsible && !expanded && files.length === 0) {
    return (
      <div className="file-upload-zone-wrap file-upload-zone-collapsed">
        <button
          type="button"
          className="composer-attach-trigger"
          onClick={() => setExpanded(true)}
        >
          <Upload size={16} />
          <span>添加材料（合同、证据、截图）</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.zip,image/*"
          hidden
          onChange={(event) => void handleInputChange(event)}
        />
      </div>
    );
  }

  return (
    <div className="file-upload-zone-wrap">
      <div
        className={`feature-upload-zone file-upload-zone${dragOver ? ' drag-over' : ''}${compact ? ' compact' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => void handleDrop(event)}
      >
        <Upload size={22} />
        <div>
          <strong>{uploading ? '正在上传材料…' : '拖拽或选择本地文件'}</strong>
          <span>{hint || '支持 PDF、Word、TXT、Markdown、图片等格式。上传成功后会自动关联到当前任务。'}</span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          选择文件
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.zip,image/*"
        hidden
        onChange={(event) => void handleInputChange(event)}
      />

      {files.length > 0 && (
        <div className="composer-attachments">
          {files.map((file) => (
            <div key={`${file.uploadId}-${file.filename}`} className="composer-attachment-chip">
              <FileText size={14} />
              <span>{file.filename}</span>
              {file.sizeMb !== undefined && <em>{file.sizeMb} MB</em>}
              <button type="button" onClick={() => removeFile(file.filename)} aria-label="移除材料">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <div className="composer-upload-error">{uploadError}</div>}
    </div>
  );
}

export default FileUploadZone;
