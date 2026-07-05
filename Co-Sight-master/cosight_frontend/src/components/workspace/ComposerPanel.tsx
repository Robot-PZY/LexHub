import { FileText, Paperclip, Send } from 'lucide-react';
import { useState } from 'react';
import type { UploadedFileInfo } from '../../lib/chat';
import FileUploadZone from './FileUploadZone';

const templateSections: Array<{ label: string; text: string }> = [
  { label: '事实背景', text: '\n【事实背景】\n' },
  { label: '相关材料', text: '\n【相关材料】\n' },
  { label: '目标产出', text: '\n【目标产出】\n' },
];

type ComposerPanelProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (uploadIds: string[], content: string) => void;
  placeholder?: string;
  scenarioHint?: string;
  uploadMeta?: { userAccount?: string; taskId?: string; taskTitle?: string };
  submitDisabled?: boolean;
};

function ComposerPanel({
  draft,
  onDraftChange,
  onSubmit,
  placeholder,
  scenarioHint,
  uploadMeta,
  submitDisabled = false,
}: ComposerPanelProps) {
  const [attachments, setAttachments] = useState<UploadedFileInfo[]>([]);
  const [uploadExpanded, setUploadExpanded] = useState(false);

  const handleSubmit = () => {
    const uploadIds = [...new Set(attachments.map((item) => item.uploadId))];
    const content = draft.trim() || (attachments.length > 0
      ? `请基于已上传的 ${attachments.length} 份材料完成法律分析，并给出可复核建议。材料：${attachments.map((item) => item.filename).join('、')}`
      : '');
    if (!content) return;
    onSubmit(uploadIds, content);
    setAttachments([]);
    setUploadExpanded(false);
  };

  const insertTemplate = (text: string) => {
    const next = draft.endsWith('\n') || !draft ? `${draft}${text}` : `${draft}${text}`;
    onDraftChange(next);
  };

  const canSubmit = Boolean(draft.trim() || attachments.length > 0);
  const showUploadPanel = uploadExpanded || attachments.length > 0;

  return (
    <div className="composer-react composer-react-intake">
      <div className="composer-input-wrap">
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={placeholder || '描述你的法律任务：事实背景、已有材料、希望输出的结果…'}
          rows={12}
        />
        {scenarioHint ? <p className="composer-scenario-hint">{scenarioHint}</p> : null}
      </div>

      <div className="composer-intake-actions">
        <button
          type="button"
          className={`composer-attach-trigger${showUploadPanel ? ' active' : ''}`}
          onClick={() => setUploadExpanded((value) => !value)}
        >
          <Paperclip size={16} />
          <span>
            {attachments.length > 0
              ? `已选 ${attachments.length} 份材料`
              : '添加材料'}
          </span>
        </button>
        <span className="composer-intake-note">上传后自动收录至材料库</span>
      </div>

      {showUploadPanel && (
        <FileUploadZone
          files={attachments}
          onChange={setAttachments}
          compact
          collapsible={false}
          uploadMeta={uploadMeta}
          hint="支持合同、票据、截图、聊天记录等。也可只上传材料，由系统补充任务描述。"
        />
      )}

      <div className="composer-template-bar">
        <span className="composer-template-label">结构化补充</span>
        {templateSections.map((item) => (
          <button
            key={item.label}
            type="button"
            className="composer-template-btn"
            onClick={() => insertTemplate(item.text)}
          >
            {item.label}
          </button>
        ))}
        {attachments.length > 0 && (
          <span className="ds-chip ds-chip-success composer-attach-badge">
            <FileText size={12} />
            {attachments.length} 份待提交
          </span>
        )}
      </div>

      <div className="composer-toolbar composer-toolbar-intake">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          disabled={!canSubmit || submitDisabled}
        >
          <Send size={16} />
          <span>开始处理</span>
        </button>
      </div>
    </div>
  );
}

export default ComposerPanel;
