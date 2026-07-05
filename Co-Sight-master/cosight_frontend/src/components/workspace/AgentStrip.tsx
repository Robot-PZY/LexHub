import type { AgentRuntimeCard } from '../../types/chat';

type AgentStripProps = {
  agents: AgentRuntimeCard[];
};

function AgentStrip({ agents }: AgentStripProps) {
  return (
    <section className="records-panel-react agent-strip-react">
      <div className="records-head-react">
        <strong>协作智能体</strong>
        <span className="workspace-side-caption-react">根据任务阶段自动切换职责与输出重点</span>
      </div>

      <div className="agent-strip-list-react">
        {agents.map((agent) => (
          <article key={agent.id} className={`agent-card-react ${agent.status}`}>
            <div className="agent-card-head-react">
              <strong>{agent.label}</strong>
              <span className="agent-status-react">
                {agent.status === 'active' ? '处理中' : agent.status === 'completed' ? '已完成' : '等待中'}
              </span>
            </div>
            <p>{agent.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AgentStrip;
