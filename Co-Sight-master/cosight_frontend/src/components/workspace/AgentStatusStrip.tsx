import type { RoutedAgent } from '../../types/routing';

const AGENT_ORDER = ['planner', 'evidence', 'research', 'drafting', 'review'] as const;

const AGENT_LABELS: Record<string, string> = {
  planner: '理解',
  evidence: '证据',
  research: '研究',
  drafting: '文书',
  review: '审查',
};

type AgentStatusStripProps = {
  agents: RoutedAgent[];
  compact?: boolean;
};

function AgentStatusStrip({ agents, compact = false }: AgentStatusStripProps) {
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <div className={`agent-status-strip${compact ? ' compact' : ''}`} role="list" aria-label="动态智能体状态">
      {AGENT_ORDER.map((id) => {
        const agent = agentMap.get(id);
        const status = agent?.status ?? 'idle';
        return (
          <div key={id} className={`agent-status-node ${status}`} role="listitem" title={agent?.reason}>
            <span className="agent-status-dot" aria-hidden="true" />
            <div className="agent-status-copy">
              <strong>{AGENT_LABELS[id] ?? id}</strong>
              {!compact && agent && <em>{agent.trigger}</em>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AgentStatusStrip;
