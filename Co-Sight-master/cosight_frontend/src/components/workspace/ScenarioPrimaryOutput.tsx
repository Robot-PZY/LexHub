import { ClipboardList, FileSearch, Scale, ScrollText } from 'lucide-react';
import type { ResultInsight } from '../../types/chat';
import type { ExecutionSnapshot } from '../../types/execution';
import { extractRiskStats } from '../../lib/report-enricher';
import { getScenarioOutputProfile, findScenario } from '../../lib/scenarios';

type ScenarioPrimaryOutputProps = {
  scenarioId?: string;
  resultSummary: string;
  resultInsight: ResultInsight;
  snapshot?: ExecutionSnapshot | null;
  onOpenDeliverable?: () => void;
};

function ScenarioPrimaryOutput({
  scenarioId,
  resultSummary,
  resultInsight,
  snapshot,
  onOpenDeliverable,
}: ScenarioPrimaryOutputProps) {
  const scenario = findScenario(scenarioId ?? '');
  const profile = getScenarioOutputProfile(scenarioId);
  const riskStats = extractRiskStats(resultSummary);

  if (profile.primary === 'report' || profile.primary === 'document') {
    return null;
  }

  const iconMap = {
    review: Scale,
    checklist: ClipboardList,
    research: FileSearch,
    report: ScrollText,
    document: ScrollText,
  };
  const Icon = iconMap[profile.primary];

  return (
    <section className="ds-card scenario-primary-output">
      <div className="scenario-primary-head">
        <div className="scenario-primary-title">
          <Icon size={18} />
          <div>
            <p className="eyebrow">PRIMARY DELIVERABLE</p>
            <h3>{profile.primaryLabel}</h3>
            <span>{profile.primaryHint}</span>
          </div>
        </div>
        {scenario && <span className="ds-badge ds-badge-primary">{scenario.title}</span>}
      </div>

      {profile.primary === 'review' && (
        <div className="scenario-primary-body">
          <div className="scenario-primary-metrics">
            <article className="high">
              <strong>{riskStats.high || '—'}</strong>
              <span>高风险项</span>
            </article>
            <article className="medium">
              <strong>{riskStats.medium || '—'}</strong>
              <span>中风险项</span>
            </article>
            <article>
              <strong>{snapshot?.stats.completedSteps ?? 0}/{snapshot?.stats.stepCount ?? 0}</strong>
              <span>审查阶段</span>
            </article>
          </div>
          <p className="scenario-primary-summary">{resultInsight.recommendation}</p>
        </div>
      )}

      {profile.primary === 'checklist' && (
        <div className="scenario-primary-body">
          <p className="scenario-primary-summary">{resultInsight.risk}</p>
          <div className="scenario-primary-list">
            {resultInsight.evidenceReferences.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {profile.showDeliverable && onOpenDeliverable && (
            <button type="button" className="btn btn-secondary" onClick={onOpenDeliverable}>
              生成证据清单
            </button>
          )}
        </div>
      )}

      {profile.primary === 'research' && (
        <div className="scenario-primary-body">
          <p className="scenario-primary-summary">{resultInsight.conclusion.slice(0, 280)}</p>
          <div className="scenario-primary-list research">
            {resultInsight.evidenceReferences.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          {snapshot && snapshot.steps.length > 0 && (
            <div className="scenario-primary-steps">
              {snapshot.steps.map((step) => (
                <div key={step.index}>
                  <em>{step.statusLabel}</em>
                  <p>{step.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ScenarioPrimaryOutput;
