import { GitBranch, Workflow } from 'lucide-react';
import type { WorkflowConfig } from '../../types/workflow';
import { formatLegalAgentLabel } from '../../lib/dag-utils';

type WorkflowConfigPanelProps = {
  config: WorkflowConfig;
  compact?: boolean;
  readOnly?: boolean;
};

function WorkflowConfigPanel({ config, compact = false, readOnly = false }: WorkflowConfigPanelProps) {
  const dagNodes = config.dag?.nodes ?? [];
  const routingRules = config.routingRules ?? [];

  return (
    <section className={`ds-card workflow-config-panel ${compact ? 'compact' : ''}`}>
      <div className="workflow-config-head">
        <Workflow size={18} />
        <div>
          <p className="eyebrow">WORKFLOW CONFIG</p>
          <strong>{config.name}</strong>
          <span>
            {config.framework} v{config.version}
            {config.description ? ` · ${config.description}` : ''}
          </span>
        </div>
        {readOnly && <span className="ds-badge ds-badge-primary">只读预览</span>}
      </div>

      <div className="workflow-config-grid">
        <article className="workflow-config-block">
          <strong>智能体编排</strong>
          <div className="workflow-agent-list">
            {config.agents.map((agent) => (
              <div key={agent.id} className="workflow-agent-row">
                <em>{agent.name}</em>
                <span>{agent.trigger ?? '按需调度'}</span>
                {agent.modelEnv && <code>{agent.modelEnv}</code>}
              </div>
            ))}
          </div>
        </article>

        {dagNodes.length > 0 && (
          <article className="workflow-config-block">
            <strong>DAG 节点与条件分支</strong>
            <div className="workflow-dag-list">
              {dagNodes.map((node, index) => (
                <div key={node.id} className="workflow-dag-row">
                  <span className="dag-hop">N{index + 1}</span>
                  <div>
                    <em>{node.label}</em>
                    <span>{formatLegalAgentLabel(node.agent)}</span>
                    {node.condition && <code>{node.condition}</code>}
                  </div>
                  {index < dagNodes.length - 1 && (
                    <GitBranch size={14} className="workflow-dag-connector-icon" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </article>
        )}
      </div>

      {routingRules.length > 0 && (
        <div className="workflow-routing-rules">
          <strong>动态调度规则</strong>
          <ul>
            {routingRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default WorkflowConfigPanel;
