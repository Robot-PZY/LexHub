import { GitBranch, Target } from 'lucide-react';
import type { AgentRoutingState } from '../../types/routing';
import AgentStatusStrip from './AgentStatusStrip';

type RoutingDecisionPanelProps = {
  routing: AgentRoutingState | null;
  loading?: boolean;
  source?: 'api' | 'mock';
};

function riskLabel(level: string) {
  if (level === 'high') return '高';
  if (level === 'medium') return '中';
  return '低';
}

function RoutingDecisionPanel({ routing, loading = false, source }: RoutingDecisionPanelProps) {
  if (loading) {
    return (
      <section className="ds-card routing-decision-card">
        <div className="routing-decision-head">
          <GitBranch size={18} />
          <strong>路径研判</strong>
        </div>
        <p className="workspace-side-caption-react">正在分析事项状态…</p>
      </section>
    );
  }

  if (!routing) {
    return (
      <section className="ds-card routing-decision-card">
        <div className="routing-decision-head">
          <GitBranch size={18} />
          <strong>路径研判</strong>
        </div>
        <p className="workspace-side-caption-react">输入事项描述后，系统将展示状态驱动的办理建议。</p>
      </section>
    );
  }

  const { metrics } = routing;

  return (
    <section className="ds-card routing-decision-card">
      <div className="routing-decision-head">
        <div>
          <p className="eyebrow">ROUTING DECISION</p>
          <strong>状态驱动办理</strong>
        </div>
        {source && (
          <span className={`ds-badge ${source === 'api' ? 'ds-badge-success' : 'ds-badge-warning'}`}>
            {source === 'api' ? '实时' : '示例'}
          </span>
        )}
      </div>

      <div className="routing-metrics-grid">
        <div className="routing-metric">
          <span>材料完整度</span>
          <div className="routing-metric-bar">
            <i style={{ width: `${metrics.materialCompleteness}%` }} />
          </div>
          <em>{metrics.materialCompleteness}%</em>
        </div>
        <div className="routing-metric">
          <span>法规引用度</span>
          <div className="routing-metric-bar">
            <i style={{ width: `${metrics.citationCoverage}%` }} />
          </div>
          <em>{metrics.citationCoverage}%</em>
        </div>
        <div className="routing-metric">
          <span>风险等级</span>
          <strong className={`routing-risk ${metrics.riskLevel}`}>{riskLabel(metrics.riskLevel)}</strong>
        </div>
      </div>

      <AgentStatusStrip agents={routing.activeAgents} />

      <div className="routing-decision-list">
        {routing.routingDecisions.map((item) => (
          <div key={item} className="routing-decision-item">
            <span className="routing-decision-bullet" />
            <p>{item}</p>
          </div>
        ))}
      </div>

      <article className="routing-next-card">
        <Target size={16} />
        <div>
          <strong>下一步建议</strong>
          <p>{routing.nextSuggestion}</p>
        </div>
      </article>
    </section>
  );
}

export default RoutingDecisionPanel;
