import { renderMarkdownHtml } from '../../lib/report-parser';

type PhaseResultCardProps = {
  result: string;
  completed?: boolean;
};

function PhaseResultCard({ result, completed = false }: PhaseResultCardProps) {
  const text = result.trim();
  if (!text || !completed) return null;

  const html = renderMarkdownHtml(text);

  return (
    <article className="ds-card phase-result-card">
      <div className="phase-result-head">
        <p className="eyebrow">FINAL SUMMARY</p>
        <strong>结论摘要</strong>
        <span>完整报告请前往「审查结论」页查看</span>
      </div>
      <div
        className="phase-result-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}

export default PhaseResultCard;
