import { Bot } from 'lucide-react';
import type { AgentRuntimeCard, AgentStep, ToolCallTrace } from '../../types/chat';
import { deriveAgentInvocations } from '../../lib/dag-utils';

type AgentEvidencePanelProps = {
  agents: AgentRuntimeCard[];
  steps: AgentStep[];
  toolCalls: ToolCallTrace[];
};

function AgentEvidencePanel({ agents, steps, toolCalls }: AgentEvidencePanelProps) {
  const invocations = deriveAgentInvocations(steps, toolCalls);
  const activeCount = agents.filter((agent) => agent.status !== 'idle').length;

  return (
    <section className="ds-card agent-evidence-panel">
      <div className="agent-evidence-head">
        <Bot size={18} />
        <div>
          <strong>多智能体运行证据</strong>
          <span>来自 Co-Sight WebSocket 阶段事件与工具调用记录</span>
        </div>
        <em>{activeCount} 个已参与</em>
      </div>

      {invocations.length === 0 ? (
        <p className="workspace-side-caption-react">任务执行后，这里会展示每个智能体的阶段推进与工具调用证据。</p>
      ) : (
        <div className="agent-evidence-grid">
          {invocations.map((item) => (
            <article key={item.agent} className="agent-evidence-card">
              <strong>{item.label}</strong>
              <div className="agent-evidence-stats">
                <span>{item.steps} 个阶段</span>
                <span>{item.tools} 次工具</span>
              </div>
              <p>{item.lastAction}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AgentEvidencePanel;
