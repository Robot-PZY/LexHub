import { Bot } from 'lucide-react';
import type { AgentRegistry } from '../../types/agent-registry';

type AgentRegistryPanelProps = {
  registry: AgentRegistry;
  compact?: boolean;
};

function AgentRegistryPanel({ registry, compact = false }: AgentRegistryPanelProps) {
  if (compact) {
    return (
      <section className="ds-card agent-registry-strip">
        <div className="agent-registry-strip-head">
          <Bot size={16} />
          <strong>智能体注册</strong>
          <span>{registry.agents.length} 个角色 · 工具由 Co-Sight 调度调用</span>
        </div>
        <div className="agent-registry-strip-list">
          {registry.agents.map((agent) => (
            <span key={agent.id} className="agent-registry-chip" title={agent.capabilities.join('、')}>
              {agent.name.replace('智能体', '')}
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ds-card agent-registry-panel">
      <div className="agent-registry-head">
        <Bot size={18} />
        <div>
          <p className="eyebrow">智能体注册表</p>
          <strong>角色 · 能力 · 工具</strong>
        </div>
      </div>

      <div className="agent-registry-grid">
        {registry.agents.map((agent) => (
          <article key={agent.id} className={`agent-registry-card ${agent.role}`}>
            <div className="agent-registry-card-top">
              <strong>{agent.name}</strong>
              <span className="ds-badge ds-badge-primary">{agent.role === 'orchestrator' ? '调度' : agent.role === 'reviewer' ? '复核' : '执行'}</span>
            </div>
            <p>{agent.capabilities.slice(0, 3).join(' · ')}</p>
            <div className="agent-registry-tools">
              {agent.registeredTools.length > 0
                ? agent.registeredTools.slice(0, 3).map((toolId) => {
                  const tool = registry.toolCatalog.find((item) => item.id === toolId);
                  return <span key={toolId}>{tool?.label ?? toolId}</span>;
                })
                : <span>{agent.modelLabel || 'Plan 调度'}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AgentRegistryPanel;
