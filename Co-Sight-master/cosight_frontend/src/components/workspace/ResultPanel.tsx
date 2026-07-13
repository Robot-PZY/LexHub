import type { ResultInsight } from '../../types/chat';

type ResultPanelProps = {
  resultSummary: string;
  resultInsight: ResultInsight;
  statusSummary: string;
};

function ResultPanel({ resultSummary, resultInsight, statusSummary }: ResultPanelProps) {
  return (
    <section className="records-panel-react workspace-side-panel-react">
      <div className="records-head-react">
        <strong>结果与建议</strong>
        <span className="workspace-side-caption-react">随处理进展持续更新</span>
      </div>

      <article className="result-summary-card-react">
        <strong>当前结论</strong>
        <p>{resultSummary}</p>
      </article>

      <article className="result-summary-card-react muted">
        <strong>当前状态</strong>
        <p>{statusSummary}</p>
      </article>

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

      <div className="result-checklist-react">
        <article className="result-summary-card-react soft-warning">
          <strong>风险提示</strong>
          <p>{resultInsight.risk}</p>
        </article>
        <article className="result-summary-card-react soft-primary">
          <strong>下一步建议</strong>
          <p>{resultInsight.recommendation}</p>
        </article>
        <article className="result-summary-card-react">
          <strong>引用依据</strong>
          <div className="result-reference-list-react">
            {resultInsight.evidenceReferences.map((item) => (
              <span key={item} className="result-reference-item-react">{item}</span>
            ))}
          </div>
        </article>
        <article className="result-summary-card-react muted">
          <strong>自动校验</strong>
          <p>{resultInsight.reviewNote}</p>
        </article>
      </div>
    </section>
  );
}

export default ResultPanel;
