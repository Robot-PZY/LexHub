import { Link2, Shield } from 'lucide-react';
import type { AuditLog } from '../../types/audit';

type AuditLogPanelProps = {
  auditLog: AuditLog;
  compact?: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  session_start: '会话启动',
  task_submit: '任务提交',
  agent_stage: '智能体阶段',
  tool_call: '工具调用',
  credibility_analysis: '可信分级',
  session_summary: '会话摘要',
  audit_seal: '审计封存',
};

function AuditLogPanel({ auditLog, compact = false }: AuditLogPanelProps) {
  const visibleEntries = compact ? auditLog.entries.slice(-6) : auditLog.entries;

  return (
    <section className={`ds-card audit-log-panel ${compact ? 'compact' : ''}`}>
      <div className="audit-log-head">
        <Shield size={18} />
        <div>
          <p className="eyebrow">AUDIT CHAIN</p>
          <strong>{auditLog.title}</strong>
          <em>
            {auditLog.entryCount} 条记录 · chain={auditLog.chainHash}
          </em>
        </div>
        <span className="ds-badge ds-badge-success">replay 溯源</span>
      </div>

      {!compact && (
        <div className="audit-log-meta">
          <span>工作区：{auditLog.workspaceName}</span>
          <span>操作者：{auditLog.username}</span>
          <span>会话：{auditLog.sessionId.slice(0, 8)}…</span>
        </div>
      )}

      <div className="audit-log-list">
        {visibleEntries.map((entry) => (
          <article key={entry.id} className={`audit-log-entry audit-log-${entry.type}`}>
            <div className="audit-log-entry-top">
              <span className="audit-log-seq">{String(entry.sequence).padStart(2, '0')}</span>
              <strong>{TYPE_LABELS[entry.type] || entry.type}</strong>
              <em>{entry.actor}</em>
            </div>
            <p>{entry.detail}</p>
            <div className="audit-log-entry-foot">
              {entry.timestamp ? <span>{entry.timestamp}</span> : null}
              <span className="audit-log-hash">
                <Link2 size={12} />
                {entry.hash}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AuditLogPanel;
