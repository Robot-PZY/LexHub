import { GitBranch } from 'lucide-react';
import type { AgentStep, ToolCallTrace } from '../../types/chat';
import { countDagHops, deriveDagNodes, formatLegalAgentLabel } from '../../lib/dag-utils';

type DagExecutionPanelProps = {
  steps: AgentStep[];
  toolCalls: ToolCallTrace[];
  processing?: boolean;
};

function statusText(status: string) {
  if (status === 'running') return '执行中';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '需处理';
  if (status === 'branch') return '条件分支';
  if (status === 'skipped') return '已跳过';
  return '等待中';
}

function DagExecutionPanel({ steps, toolCalls, processing = false }: DagExecutionPanelProps) {
  const nodes = deriveDagNodes(steps, toolCalls);
  const hopCount = countDagHops(nodes);

  return (
    <section className="ds-card dag-execution-panel">
      <div className="dag-execution-head">
        <div>
          <p className="eyebrow">CO-SIGHT DAG</p>
          <strong>任务编排执行视图</strong>
        </div>
        <div className="dag-execution-meta">
          <span className="ds-badge ds-badge-primary">{hopCount} 跳</span>
          <span className="ds-badge ds-badge-success">{toolCalls.length} 次工具调用</span>
        </div>
      </div>

      <p className="dag-execution-desc">
        {processing
          ? '展示 Co-Sight DAG 实际执行路径：节点可跳步、返工或并行触发工具，而非固定流水线。'
          : '提交任务后，这里会展示 Co-Sight 拆解出的 DAG 节点、分支条件与工具挂载情况。'}
      </p>

      <div className="dag-graph" aria-label="DAG 执行图">
        {nodes.map((node, index) => (
          <div key={node.id} className="dag-graph-row">
            <article className={`dag-graph-node ${node.status}`}>
              <div className="dag-graph-node-top">
                <span className="dag-hop">H{node.hop}</span>
                <strong>{node.label}</strong>
                <em>{statusText(node.status)}</em>
              </div>
              <p>{node.summary || '等待 Co-Sight 推进到该节点。'}</p>
              <div className="dag-graph-node-meta">
                <span>{formatLegalAgentLabel(node.agent)}</span>
                {node.tools.length > 0 && <span>{node.tools.join(' / ')}</span>}
              </div>
            </article>
            {index < nodes.length - 1 && (
              <div className="dag-graph-connector" aria-hidden="true">
                <GitBranch size={14} />
                <span>{node.status === 'branch' ? '条件触发' : '推进'}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default DagExecutionPanel;
