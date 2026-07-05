import { useMemo, useState } from 'react';
import { ChevronDown, FileText, Wrench } from 'lucide-react';
import type { StepToolDetail } from '../../types/plan-graph';
import { buildStepNextHint, sanitizePhaseNote } from '../../lib/phase-note';
import { renderMarkdownHtml } from '../../lib/report-parser';
import { dedupeToolRecords, formatToolDisplaySummary } from '../../lib/tool-display';

type StepToolDetailPanelProps = {
  detail: StepToolDetail;
  stepCount?: number;
  allCompleted?: boolean;
};

function statusText(status: string) {
  if (status === 'running') return '执行中';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '失败';
  return '等待';
}

function StepToolDetailPanel({ detail, stepCount = 1, allCompleted = false }: StepToolDetailPanelProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const tools = useMemo(
    () => dedupeToolRecords(detail.tools).slice(-10).reverse(),
    [detail.tools],
  );

  const sanitizedNote = useMemo(() => sanitizePhaseNote(detail.note, {
    stepIndex: detail.stepIndex,
    stepCount,
    stepTitle: detail.stepTitle,
    completed: detail.status === 'completed' || allCompleted,
  }), [detail.note, detail.stepIndex, detail.stepTitle, detail.status, stepCount, allCompleted]);

  const phaseHtml = useMemo(() => {
    if (!sanitizedNote) return '';
    return renderMarkdownHtml(sanitizedNote);
  }, [sanitizedNote]);

  const nextHint = useMemo(() => buildStepNextHint({
    stepIndex: detail.stepIndex,
    stepCount,
    stepTitle: detail.stepTitle,
    completed: detail.status === 'completed' || allCompleted,
  }), [detail.stepIndex, detail.stepTitle, detail.status, stepCount, allCompleted]);

  const runningTool = tools.find((tool) => tool.status === 'running');

  return (
    <article className="ds-card step-tool-detail-panel step-tool-detail-compact">
      <div className="step-tool-detail-head">
        <div>
          <p className="eyebrow">步骤 {detail.stepIndex + 1}</p>
          <strong>{detail.stepTitle}</strong>
        </div>
        <span className={`ds-badge ${detail.status === 'completed' ? 'ds-badge-success' : detail.status === 'failed' ? 'ds-badge-danger' : detail.status === 'running' ? 'ds-badge-warning' : 'ds-badge-primary'}`}>
          {statusText(detail.status)}
        </span>
      </div>

      <div className="step-tool-detail-tags">
        <span className="step-capability-chip">{detail.capabilityLabel}</span>
        <span className="step-agent-chip">{detail.agentLabel}</span>
      </div>

      {phaseHtml ? (
        <section className="step-phase-result">
          <div className="step-phase-result-head">
            <FileText size={14} />
            <strong>阶段结果</strong>
          </div>
          <div
            className="step-phase-result-body"
            dangerouslySetInnerHTML={{ __html: phaseHtml }}
          />
        </section>
      ) : (
        <section className="step-phase-result step-phase-result-empty">
          <div className="step-phase-result-head">
            <FileText size={14} />
            <strong>阶段结果</strong>
          </div>
          <p>
            {detail.status === 'running'
              ? runningTool
                ? `正在执行：${formatToolDisplaySummary(runningTool)}`
                : '本步执行中，完成后将在此展示阶段结论。'
              : '本步完成后，Co-Sight 会在此沉淀阶段性结论。'}
          </p>
        </section>
      )}

      {nextHint && (
        <section className="step-next-hint-card">
          <strong>下一步</strong>
          <p>{nextHint}</p>
        </section>
      )}

      <button
        type="button"
        className="step-tool-toggle"
        onClick={() => setToolsOpen((open) => !open)}
      >
        <Wrench size={14} />
        <span>工具调用 {tools.length} 条</span>
        <em>{toolsOpen ? '收起' : '展开'}</em>
        <ChevronDown size={16} className={toolsOpen ? 'open' : ''} />
      </button>

      {toolsOpen && (
        <div className="step-tool-compact-list">
          {tools.length === 0 ? (
            <p className="step-tool-detail-empty">暂无工具记录。</p>
          ) : (
            tools.map((tool) => (
              <div key={tool.id} className={`step-tool-compact-row ${tool.status}`}>
                <span className="step-tool-compact-dot" />
                <div className="step-tool-compact-copy">
                  <strong>{tool.toolLabel}</strong>
                  <span>{formatToolDisplaySummary(tool)}</span>
                </div>
                {tool.duration !== undefined ? <em>{tool.duration}s</em> : null}
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}

export default StepToolDetailPanel;
