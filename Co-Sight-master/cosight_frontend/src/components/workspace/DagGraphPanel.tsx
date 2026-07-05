import { useEffect, useId, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Network } from 'lucide-react';
import type { AgentRegistry } from '../../types/agent-registry';
import type { DagGraphEdge, DagGraphLayout } from '../../types/plan-graph';
import type { ToolCallTrace } from '../../types/chat';
import { buildStepToolDetail } from '../../lib/plan-graph';
import PhaseResultCard from './PhaseResultCard';
import StepToolDetailPanel from './StepToolDetailPanel';

type DagGraphPanelProps = {
  graph: DagGraphLayout | null;
  toolCalls: ToolCallTrace[];
  registry: AgentRegistry;
  processing?: boolean;
  readOnly?: boolean;
  preview?: boolean;
  compact?: boolean;
};

const NODE_WIDTH = 196;
const NODE_HEIGHT = 108;

function statusLabel(status: string) {
  if (status === 'running') return '执行中';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '需处理';
  return '待执行';
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'running') return <Loader2 size={13} className="dag-graph-spin" />;
  if (status === 'completed') return <CheckCircle2 size={13} />;
  return <Circle size={13} />;
}

function shortenTitle(title: string, maxLen = 42): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function buildEdgePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  edgeIndex: number,
  totalToTarget: number,
  totalFromSource: number,
  sourceEdgeIndex: number,
): string {
  const sourceOffset = totalFromSource > 1
    ? (sourceEdgeIndex - (totalFromSource - 1) / 2) * 18
    : 0;
  const targetOffset = totalToTarget > 1
    ? (edgeIndex - (totalToTarget - 1) / 2) * 18
    : 0;

  const startX = sourceX + NODE_WIDTH;
  const startY = sourceY + NODE_HEIGHT / 2 + sourceOffset;
  const endX = targetX;
  const endY = targetY + NODE_HEIGHT / 2 + targetOffset;
  const gap = Math.max(48, endX - startX);
  const bend = gap * 0.45;

  return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`;
}

function DagGraphPanel({
  graph,
  toolCalls,
  registry,
  processing = false,
  readOnly = false,
  preview = false,
  compact = false,
}: DagGraphPanelProps) {
  const markerId = useId().replace(/:/g, '');
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const layout = graph;

  const runningNodeId = useMemo(
    () => layout?.nodes.find((node) => node.status === 'running')?.id ?? null,
    [layout],
  );

  useEffect(() => {
    if (runningNodeId != null) setSelectedNodeId(runningNodeId);
  }, [runningNodeId]);

  const selectedNode = useMemo(
    () => layout?.nodes.find((node) => node.id === selectedNodeId)
      ?? layout?.nodes.find((node) => node.status === 'running')
      ?? layout?.nodes[0]
      ?? null,
    [layout, selectedNodeId],
  );

  const stepDetail = useMemo(
    () => (selectedNode && !preview ? buildStepToolDetail({ node: selectedNode, toolCalls, registry }) : null),
    [selectedNode, toolCalls, registry, preview],
  );

  const edgesByTarget = useMemo(() => {
    const map = new Map<number, DagGraphEdge[]>();
    layout?.edges.forEach((edge) => {
      const list = map.get(edge.target) ?? [];
      list.push(edge);
      map.set(edge.target, list);
    });
    return map;
  }, [layout]);

  const edgesBySource = useMemo(() => {
    const map = new Map<number, DagGraphEdge[]>();
    layout?.edges.forEach((edge) => {
      const list = map.get(edge.source) ?? [];
      list.push(edge);
      map.set(edge.source, list);
    });
    return map;
  }, [layout]);

  const graphViewport = useMemo(() => {
    if (!layout?.nodes.length) {
      return { width: 720, height: 320, offsetX: 0, offsetY: 0 };
    }
    const minX = Math.min(...layout.nodes.map((node) => node.x));
    const minY = Math.min(...layout.nodes.map((node) => node.y));
    const maxX = Math.max(...layout.nodes.map((node) => node.x)) + NODE_WIDTH;
    const maxY = Math.max(...layout.nodes.map((node) => node.y)) + NODE_HEIGHT;
    const padX = 32;
    const padY = 28;
    return {
      width: Math.max(640, maxX - minX + padX * 2),
      height: Math.max(280, maxY - minY + padY * 2),
      offsetX: minX - padX,
      offsetY: minY - padY,
    };
  }, [layout]);

  if (!layout || layout.nodes.length === 0) {
    return (
      <section className="ds-card dag-graph-panel dag-graph-panel-empty">
        <div className="dag-graph-head">
          <Network size={18} />
          <div>
            <p className="eyebrow">路径规划</p>
            <strong>Co-Sight DAG 节点图</strong>
          </div>
        </div>
        <p className="dag-graph-desc">提交任务后，将在此展示带依赖关系的执行路径，并可点击查看每步详情与阶段结果。</p>
      </section>
    );
  }

  const statusHint = preview ? '模板预览' : readOnly ? '回放模式' : processing ? '执行中' : '已完成';
  const showDetail = !compact && !preview;
  const isCompleted = !processing && !preview;

  return (
    <section className={`ds-card dag-graph-panel ${preview ? 'is-preview' : ''} ${compact ? 'is-compact' : ''} ${readOnly ? 'is-readonly' : ''}`}>
      <div className="dag-graph-head">
        <Network size={18} />
        <div className="dag-graph-title-block">
          <p className="eyebrow">路径规划</p>
          <strong>{layout.title}</strong>
          <em>{compact && preview ? '工作流模板' : `${layout.statusText || statusHint} · 点击节点查看阶段结果`}</em>
        </div>
        <span className="dag-graph-stat">
          {layout.nodes.length} 步 · {layout.edges.length} 边 · {layout.progressLabel}
        </span>
      </div>

      <div className="dag-graph-layout">
        <div className="dag-graph-canvas-wrap">
          <svg
            className="dag-graph-canvas"
            viewBox={`0 0 ${graphViewport.width} ${graphViewport.height}`}
            role="img"
            aria-label="Co-Sight DAG 节点图"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker id={`dag-arrow-${markerId}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="rgba(42, 127, 118, 0.72)" />
              </marker>
              <pattern id={`dag-grid-${markerId}`} width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="rgba(148, 163, 184, 0.22)" />
              </pattern>
            </defs>

            <rect
              x={0}
              y={0}
              width={graphViewport.width}
              height={graphViewport.height}
              fill={`url(#dag-grid-${markerId})`}
            />

            <g transform={`translate(${-graphViewport.offsetX}, ${-graphViewport.offsetY})`}>
              {layout.edges.map((edge) => {
                const source = layout.nodes.find((node) => node.id === edge.source);
                const target = layout.nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;
                const targetSiblings = edgesByTarget.get(edge.target) ?? [edge];
                const sourceSiblings = edgesBySource.get(edge.source) ?? [edge];
                const edgeIndex = targetSiblings.findIndex((item) => item.id === edge.id);
                const sourceEdgeIndex = sourceSiblings.findIndex((item) => item.id === edge.id);
                const isActive = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);
                return (
                  <path
                    key={edge.id}
                    d={buildEdgePath(
                      source.x,
                      source.y,
                      target.x,
                      target.y,
                      edgeIndex,
                      targetSiblings.length,
                      sourceSiblings.length,
                      sourceEdgeIndex,
                    )}
                    className={`dag-graph-edge-path ${edge.type}${isActive ? ' active' : ''}`}
                    fill="none"
                    markerEnd={`url(#dag-arrow-${markerId})`}
                  />
                );
              })}

              {layout.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const hasPhaseResult = Boolean(node.note?.trim());
                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    <foreignObject x="0" y="0" width={NODE_WIDTH} height={NODE_HEIGHT}>
                      <button
                        type="button"
                        className={`dag-graph-node-btn ${node.status} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedNodeId(node.id)}
                        title={node.title}
                      >
                        <span className="dag-graph-node-accent" aria-hidden />
                        <span className="dag-graph-node-top">
                          <span className="dag-graph-node-id">步骤 {node.id}</span>
                          <span className={`dag-graph-node-status ${node.status}`}>
                            <StatusIcon status={node.status} />
                            {statusLabel(node.status)}
                          </span>
                        </span>
                        <strong className="dag-graph-node-title">{shortenTitle(node.title)}</strong>
                        <span className="dag-graph-node-meta-line">
                          <span>{node.capabilityLabel}</span>
                          {hasPhaseResult && !preview ? <em>有结果</em> : null}
                        </span>
                      </button>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {showDetail ? (
          stepDetail ? (
            <StepToolDetailPanel
              detail={stepDetail}
              stepCount={layout.nodes.length}
              allCompleted={isCompleted}
            />
          ) : (
            <article className="ds-card step-tool-detail-panel step-tool-detail-placeholder">
              <strong>节点详情</strong>
              <p>点击左侧节点，查看阶段结果与工具调用。</p>
            </article>
          )
        ) : null}
      </div>

      {!preview && !compact && (
        <PhaseResultCard result={layout.result} completed={isCompleted} />
      )}
    </section>
  );
}

export default DagGraphPanel;
