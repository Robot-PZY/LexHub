import { useMemo } from 'react';
import { CheckCircle2, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import type { ResultInsight } from '../../types/chat';
import type { ExecutionSnapshot } from '../../types/execution';
import ExecutionExportActions from '../documents/ExecutionExportActions';
import { buildExportPayloadFromSnapshot } from '../../lib/execution-export';
import { parseMarkdownSections, renderMarkdownHtml } from '../../lib/report-parser';
import {
  buildExecutiveSummary,
  enrichReportMarkdown,
  extractRiskStats,
} from '../../lib/report-enricher';
import { findScenario } from '../../lib/scenarios';

type TaskReportPanelProps = {
  title: string;
  scenarioId?: string;
  resultSummary: string;
  resultInsight: ResultInsight;
  snapshot?: ExecutionSnapshot | null;
  statusSummary: string;
};

function TaskReportPanel({
  title,
  scenarioId,
  resultSummary,
  resultInsight,
  snapshot,
  statusSummary,
}: TaskReportPanelProps) {
  const scenario = findScenario(scenarioId ?? '');
  const enrichedMarkdown = useMemo(
    () => enrichReportMarkdown(resultSummary, snapshot, resultInsight, scenario?.title),
    [resultSummary, snapshot, resultInsight, scenario?.title],
  );
  const sections = useMemo(() => parseMarkdownSections(enrichedMarkdown), [enrichedMarkdown]);
  const executiveSummary = useMemo(
    () => buildExecutiveSummary(resultSummary, resultInsight, snapshot),
    [resultSummary, resultInsight, snapshot],
  );
  const riskStats = useMemo(() => extractRiskStats(enrichedMarkdown), [enrichedMarkdown]);

  const exportPayload = useMemo(() => {
    if (!snapshot) return null;
    return buildExportPayloadFromSnapshot(snapshot, 'task_summary_report', 'docx', resultInsight);
  }, [snapshot, resultInsight]);

  const completedSteps = snapshot?.stats.completedSteps
    ?? snapshot?.steps.filter((step) => step.status === 'completed').length
    ?? 0;
  const totalSteps = snapshot?.stats.stepCount ?? snapshot?.steps.length ?? 0;
  const toolCount = snapshot?.stats.toolCallCount ?? 0;
  const findingCount = riskStats.high + riskStats.medium + riskStats.low;

  return (
    <section className="ds-card task-report-panel">
      <div className="task-report-head">
        <div>
          <p className="eyebrow">TASK REPORT</p>
          <h2>{snapshot?.title || title || '任务总结报告'}</h2>
          <p className="task-report-subtitle">
            {scenario ? `${scenario.title} · ${scenario.description}` : 'Co-Sight 多智能体协同执行报告'}
          </p>
        </div>
        <div className="task-report-head-actions">
          <span className="ds-badge ds-badge-success">{statusSummary}</span>
          {exportPayload && (
            <ExecutionExportActions
              payload={exportPayload}
              formats={['docx', 'pdf']}
              className="task-report-export-actions"
            />
          )}
        </div>
      </div>

      <div className="task-report-stats">
        <article>
          <span>执行阶段</span>
          <strong>{completedSteps}/{totalSteps || '—'}</strong>
          <em>已完成</em>
        </article>
        <article>
          <span>工具调用</span>
          <strong>{toolCount || '—'}</strong>
          <em>次检索与处理</em>
        </article>
        <article>
          <span>风险识别</span>
          <strong>{findingCount > 0 ? findingCount : '—'}</strong>
          <em>{findingCount > 0 ? `高 ${riskStats.high} · 中 ${riskStats.medium}` : '见报告正文'}</em>
        </article>
        <article>
          <span>引用依据</span>
          <strong>{resultInsight.evidenceReferences.length}</strong>
          <em>条可追溯来源</em>
        </article>
      </div>

      <div className="task-report-grid">
        <article className="task-report-main">
          <div className="task-report-hero">
            <div className="task-report-hero-icon">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <strong>当前结论</strong>
              <p>{executiveSummary}</p>
            </div>
          </div>

          <div className="task-report-markdown">
            {sections.map((section) => (
              <section key={section.title} className="task-report-section">
                <h3>{section.title}</h3>
                <div
                  className="task-report-markdown-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(section.body) }}
                />
              </section>
            ))}
          </div>
        </article>

        <aside className="task-report-side">
          <article className={`result-summary-card-react result-credibility-react review-${resultInsight.credibility.reviewLevel}`}>
            <div className="result-credibility-head-react">
              <strong>可信度等级</strong>
              <span className={`result-review-badge-react ${resultInsight.credibility.reviewLevel}`}>
                {resultInsight.credibility.reviewLabel}
              </span>
            </div>
            <div className="result-credibility-score-react">
              <span>{resultInsight.credibility.score}</span>
              <p>{resultInsight.credibility.label}</p>
            </div>
            <div className="result-credibility-bar-react" aria-hidden="true">
              <span style={{ width: `${resultInsight.credibility.score}%` }} />
            </div>
          </article>

          {snapshot && snapshot.steps.length > 0 && (
            <article className="task-report-side-card">
              <strong><Sparkles size={14} /> 执行阶段</strong>
              <div className="task-report-steps">
                {snapshot.steps.map((step) => (
                  <div key={`${step.index}-${step.title}`} className={`task-report-step ${step.status}`}>
                    <span>{step.index + 1}</span>
                    <div>
                      <em>{step.statusLabel}</em>
                      <p>{step.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          <article className="task-report-side-card warning">
            <strong>风险提示</strong>
            <p>{resultInsight.risk}</p>
          </article>

          <article className="task-report-side-card primary">
            <strong>下一步建议</strong>
            <p>{resultInsight.recommendation}</p>
          </article>

          <article className="task-report-side-card">
            <strong><FileText size={14} /> 引用依据</strong>
            <div className="task-report-references">
              {resultInsight.evidenceReferences.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <article className="task-report-side-card muted">
            <strong><ShieldCheck size={14} /> 复核提示</strong>
            <p>{resultInsight.reviewNote}</p>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default TaskReportPanel;
