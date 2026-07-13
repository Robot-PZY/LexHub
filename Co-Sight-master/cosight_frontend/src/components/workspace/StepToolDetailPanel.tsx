import { useMemo, useState } from 'react';
import { Braces, ChevronDown, ExternalLink, FileText, Network, Wrench } from 'lucide-react';
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
  if (status === 'running') return '办理中';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '失败';
  return '等待';
}

function compactJson(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function recordLabel(record: Record<string, unknown>, fallback: string): string {
  return String(record.title || record.name || record.label || record.fileName || record.url || record.path || fallback);
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

      {(detail.parallelGroup || detail.expectedArtifact || detail.condition) && (
        <section className="step-routing-context" aria-label="规划上下文">
          {detail.parallelGroup ? <span><Network size={13} />并行组：{detail.parallelGroup}</span> : null}
          {detail.expectedArtifact ? <span><FileText size={13} />预期产物：{detail.expectedArtifact}</span> : null}
          {detail.condition ? <p>执行条件：{detail.condition}</p> : null}
        </section>
      )}

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
                ? `正在处理：${formatToolDisplaySummary(runningTool)}`
                : '本步办理中，完成后将在此展示阶段结论。'
              : '本步完成后，系统会在此沉淀阶段性结论。'}
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
        <span>处理动作 {tools.length} 条</span>
        <em>{toolsOpen ? '收起' : '展开'}</em>
        <ChevronDown size={16} className={toolsOpen ? 'open' : ''} />
      </button>

      {toolsOpen && (
        <div className="step-tool-compact-list">
          {tools.length === 0 ? (
            <p className="step-tool-detail-empty">暂无处理记录。</p>
          ) : (
            tools.map((tool) => (
              <div key={tool.id} className={`step-tool-compact-row ${tool.status}`}>
                <span className="step-tool-compact-dot" />
                <div className="step-tool-compact-copy">
                  <strong>{tool.toolLabel}</strong>
                  <span>{formatToolDisplaySummary(tool)}</span>
                </div>
                {tool.duration !== undefined ? <em>{tool.duration}s</em> : null}
                {(tool.capabilityId || tool.resultType || tool.sources?.length || tool.artifacts?.length || tool.resultData != null) ? (
                  <details className="tool-structured-result">
                    <summary>
                      <Braces size={13} />
                      结构化结果
                      {tool.resultType ? <span>{tool.resultType}</span> : null}
                    </summary>
                    <div className="tool-result-meta">
                      {tool.runtimeAgentId ? <span>智能体：{tool.runtimeAgentId}</span> : null}
                      {tool.capabilityId ? <span>能力：{tool.capabilityId}</span> : null}
                      {tool.apiLabel ? <span>实现：{tool.apiLabel}</span> : null}
                    </div>
                    {tool.sources?.length ? (
                      <div className="tool-result-links">
                        <strong>依据来源</strong>
                        {tool.sources.slice(0, 6).map((source, index) => {
                          const url = typeof source.url === 'string' ? source.url : undefined;
                          return url ? (
                            <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                              {recordLabel(source, `来源 ${index + 1}`)}<ExternalLink size={12} />
                            </a>
                          ) : <span key={index}>{recordLabel(source, `来源 ${index + 1}`)}</span>;
                        })}
                      </div>
                    ) : null}
                    {tool.artifacts?.length ? (
                      <div className="tool-result-links">
                        <strong>生成产物</strong>
                        {tool.artifacts.slice(0, 6).map((artifact, index) => (
                          <span key={index}>{recordLabel(artifact, `产物 ${index + 1}`)}</span>
                        ))}
                      </div>
                    ) : null}
                    {tool.resultData != null ? <pre>{compactJson(tool.resultData).slice(0, 4000)}</pre> : null}
                  </details>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}

export default StepToolDetailPanel;
