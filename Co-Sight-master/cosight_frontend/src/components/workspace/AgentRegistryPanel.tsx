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
          <strong>专业角色注册</strong>
          <span>{registry.agents.length} 个角色 · 按事项状态协同办理</span>
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
          <p className="eyebrow">角色注册表</p>
          <strong>角色 · 能力 · 处理动作</strong>
        </div>
      </div>

      <div className="agent-registry-grid">
        {registry.agents.map((agent) => (
          <article key={agent.id} className={`agent-registry-card ${agent.role}`}>
            <div className="agent-registry-card-top">
              <strong>{agent.name}</strong>
              <span className="ds-badge ds-badge-primary">{agent.role === 'orchestrator' ? '受理' : agent.role === 'reviewer' ? '复核' : '办理'}</span>
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
