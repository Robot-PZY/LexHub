import { getAgentById, resolveStepAssignment, resolveToolLabel } from './agent-registry';
import type { AgentRegistry } from '../types/agent-registry';
import type { WorkflowConfig } from '../types/workflow';
import type { AgentStep, AgentStepStatus, ChatMessage, ToolCallTrace } from '../types/chat';
import type { ExecutionSnapshot } from '../types/execution';
import type { DagGraphEdge, DagGraphLayout, DagGraphNode, PlanSnapshot, StepToolDetail } from '../types/plan-graph';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizePlanStatus(raw: string | undefined, hasCompletedSession: boolean, isLastRunning: boolean): AgentStepStatus {
  if (hasCompletedSession) return 'completed';
  if (raw === 'completed') return 'completed';
  if (raw === 'in_progress' || raw === 'running') return 'running';
  if (raw === 'blocked' || raw === 'failed') return 'failed';
  if (isLastRunning) return 'running';
  if (raw === 'not_started') return 'pending';
  return 'pending';
}

function normalizeDependencyKeys(dependencies: Record<string, number[]>, stepCount: number): DagGraphEdge[] {
  const edges: DagGraphEdge[] = [];
  const depKeys = Object.keys(dependencies).map((key) => parseInt(key, 10)).filter(Number.isInteger);
  const depValues = Object.values(dependencies).flat().map((value) => parseInt(String(value), 10)).filter(Number.isInteger);
  const zeroBased = (depKeys.length > 0 && Math.min(...depKeys) === 0)
    || (depValues.length > 0 && Math.min(...depValues) === 0);

  Object.entries(dependencies).forEach(([targetKey, sources]) => {
    const targetRaw = parseInt(targetKey, 10);
    const targetId = zeroBased ? targetRaw + 1 : targetRaw;
    if (!Number.isInteger(targetId) || targetId < 1 || targetId > stepCount) return;

    (sources || []).forEach((sourceRaw) => {
      const sourceParsed = parseInt(String(sourceRaw), 10);
      const sourceId = zeroBased ? sourceParsed + 1 : sourceParsed;
      if (!Number.isInteger(sourceId) || sourceId < 1 || sourceId > stepCount || sourceId === targetId) return;
      edges.push({
        id: `${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: 'dependency',
      });
    });
  });

  if (edges.length === 0 && stepCount > 1) {
    for (let index = 1; index < stepCount; index += 1) {
      edges.push({
        id: `${index}-${index + 1}`,
        source: index,
        target: index + 1,
        type: 'sequential',
      });
    }
  }

  return edges;
}

function computeLevels(nodeCount: number, edges: DagGraphEdge[]): Map<number, number> {
  const levels = new Map<number, number>();
  for (let id = 1; id <= nodeCount; id += 1) {
    levels.set(id, 0);
  }

  edges.forEach((edge) => {
    const next = (levels.get(edge.target) ?? 0);
    levels.set(edge.target, Math.max(next, (levels.get(edge.source) ?? 0) + 1));
  });

  return levels;
}

function layoutNodes(nodeCount: number, edges: DagGraphEdge[]): Map<number, { x: number; y: number; level: number }> {
  const levels = computeLevels(nodeCount, edges);
  const buckets = new Map<number, number[]>();
  for (let id = 1; id <= nodeCount; id += 1) {
    const level = levels.get(id) ?? 0;
    const list = buckets.get(level) ?? [];
    list.push(id);
    buckets.set(level, list);
  }

  const positions = new Map<number, { x: number; y: number; level: number }>();
  const levelWidth = 248;
  const nodeGap = 28;
  const nodeHeight = 108;
  const topPadding = 48;
  const maxColumnSize = Math.max(1, ...[...buckets.values()].map((list) => list.length));
  const columnSpan = maxColumnSize * nodeHeight + (maxColumnSize - 1) * nodeGap;

  [...buckets.entries()].sort(([a], [b]) => a - b).forEach(([level, ids]) => {
    const columnHeight = ids.length * nodeHeight + Math.max(0, ids.length - 1) * nodeGap;
    const startY = topPadding + Math.max(0, (columnSpan - columnHeight) / 2);
    ids.forEach((id, rowIndex) => {
      positions.set(id, {
        x: 56 + level * levelWidth,
        y: startY + rowIndex * (nodeHeight + nodeGap),
        level,
      });
    });
  });

  return positions;
}

export function extractLatestPlanSnapshot(messages: ChatMessage[]): PlanSnapshot | null {
  const stepMessages = messages.filter((message) => message.messageType === 'lui-message-manus-step');
  if (stepMessages.length === 0) return null;

  const latest = stepMessages[stepMessages.length - 1];
  const raw = asRecord(latest.data);
  const steps = Array.isArray(raw.steps) ? raw.steps.filter((item): item is string => typeof item === 'string') : [];
  if (steps.length === 0) return null;

  const humanQuery = messages.find((message) => message.role === 'human')?.content;

  return {
    title: typeof raw.title === 'string' ? raw.title : '法律事项办理',
    taskQuery: humanQuery,
    steps,
    stepStatuses: asRecord(raw.step_statuses) as PlanSnapshot['stepStatuses'],
    stepNotes: asRecord(raw.step_notes) as Record<string, string>,
    dependencies: Object.entries(asRecord(raw.dependencies)).reduce<Record<string, number[]>>((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value.map((item) => Number(item)).filter(Number.isFinite) : [];
      return acc;
    }, {}),
    stepAgentIds: asRecord(raw.step_agent_ids) as Record<string, string>,
    stepParallelGroups: asRecord(raw.step_parallel_groups) as Record<string, string>,
    stepConditions: asRecord(raw.step_conditions) as Record<string, string>,
    stepExpectedArtifacts: asRecord(raw.step_expected_artifacts) as Record<string, string>,
    selectedAgents: Array.isArray(raw.selected_agents) ? raw.selected_agents.filter((item): item is string => typeof item === 'string') : [],
    skippedAgents: Array.isArray(raw.skipped_agents) ? raw.skipped_agents.filter((item): item is { agentId: string; reason: string } => Boolean(item && typeof item === 'object' && typeof (item as { agentId?: unknown }).agentId === 'string' && typeof (item as { reason?: unknown }).reason === 'string')) : [],
    scenario: typeof raw.scenario === 'string' ? raw.scenario : '',
    targetOutput: typeof raw.target_output === 'string' ? raw.target_output : '',
    riskLevel: typeof raw.risk_level === 'string' ? raw.risk_level : 'medium',
    progress: {
      total: Number(asRecord(raw.progress).total ?? steps.length),
      completed: Number(asRecord(raw.progress).completed ?? 0),
      in_progress: Number(asRecord(raw.progress).in_progress ?? 0),
      blocked: Number(asRecord(raw.progress).blocked ?? 0),
      not_started: Number(asRecord(raw.progress).not_started ?? 0),
    },
    result: typeof raw.result === 'string' ? raw.result : '',
    statusText: typeof raw.statusText === 'string' ? raw.statusText : '',
  };
}

export function extractPlanSnapshotFromReplayContent(content: unknown): PlanSnapshot | null {
  const raw = asRecord(content);
  const steps = Array.isArray(raw.steps) ? raw.steps.filter((item): item is string => typeof item === 'string') : [];
  if (steps.length === 0) return null;

  return {
    title: typeof raw.title === 'string' ? raw.title : '法律事项办理',
    steps,
    stepStatuses: asRecord(raw.step_statuses) as PlanSnapshot['stepStatuses'],
    stepNotes: asRecord(raw.step_notes) as Record<string, string>,
    dependencies: Object.entries(asRecord(raw.dependencies)).reduce<Record<string, number[]>>((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value.map((item) => Number(item)).filter(Number.isFinite) : [];
      return acc;
    }, {}),
    stepAgentIds: asRecord(raw.step_agent_ids) as Record<string, string>,
    stepParallelGroups: asRecord(raw.step_parallel_groups) as Record<string, string>,
    stepConditions: asRecord(raw.step_conditions) as Record<string, string>,
    stepExpectedArtifacts: asRecord(raw.step_expected_artifacts) as Record<string, string>,
    selectedAgents: Array.isArray(raw.selected_agents) ? raw.selected_agents.filter((item): item is string => typeof item === 'string') : [],
    skippedAgents: Array.isArray(raw.skipped_agents) ? raw.skipped_agents.filter((item): item is { agentId: string; reason: string } => Boolean(item && typeof item === 'object' && typeof (item as { agentId?: unknown }).agentId === 'string' && typeof (item as { reason?: unknown }).reason === 'string')) : [],
    scenario: typeof raw.scenario === 'string' ? raw.scenario : '',
    targetOutput: typeof raw.target_output === 'string' ? raw.target_output : '',
    riskLevel: typeof raw.risk_level === 'string' ? raw.risk_level : 'medium',
    progress: {
      total: Number(asRecord(raw.progress).total ?? steps.length),
      completed: Number(asRecord(raw.progress).completed ?? 0),
    },
    result: typeof raw.result === 'string' ? raw.result : '',
    statusText: typeof raw.statusText === 'string' ? raw.statusText : '',
  };
}

export function buildDagGraphLayout(params: {
  snapshot: PlanSnapshot | null;
  toolCalls: ToolCallTrace[];
  registry: AgentRegistry;
  hasCompletedSession?: boolean;
}): DagGraphLayout | null {
  const { snapshot, toolCalls, registry, hasCompletedSession = false } = params;
  if (!snapshot || snapshot.steps.length === 0) return null;

  const edges = normalizeDependencyKeys(snapshot.dependencies, snapshot.steps.length);
  const positions = layoutNodes(snapshot.steps.length, edges);
  const runningIndex = snapshot.steps.findIndex((title) => {
    const raw = snapshot.stepStatuses[title];
    return raw === 'in_progress' || raw === 'running';
  });

  const nodes: DagGraphNode[] = snapshot.steps.map((title, index) => {
    const nodeId = index + 1;
    const rawStatus = snapshot.stepStatuses[title] ?? 'not_started';
    const stepTools = toolCalls.filter((tool) => tool.stepIndex === index);
    const hasToolFailure = stepTools.some((tool) => tool.status === 'failed');
    const isLastRunning = runningIndex === index || (runningIndex === -1 && index === snapshot.steps.length - 1 && !hasCompletedSession);
    const assignment = resolveStepAssignment({
      registry,
      stepTitle: title,
      stepIndex: index,
      stepCount: snapshot.steps.length,
      toolCalls,
    });
    const explicitAgent = getAgentById(registry, snapshot.stepAgentIds[String(index)] ?? '');
    const pos = positions.get(nodeId) ?? { x: 40, y: 30 + index * 110, level: index };

    let status = normalizePlanStatus(rawStatus, hasCompletedSession, isLastRunning);
    if (hasToolFailure && status !== 'completed') {
      status = 'failed';
    }

    return {
      id: nodeId,
      stepIndex: index,
      title,
      status,
      rawStatus: hasToolFailure ? 'failed' : rawStatus,
      note: snapshot.stepNotes[title] ?? '',
      agentId: explicitAgent?.id ?? assignment.agent.id,
      agentLabel: explicitAgent?.name ?? assignment.agent.name,
      capabilityId: assignment.capabilityId,
      capabilityLabel: assignment.capabilityLabel,
      modelLabel: assignment.agent.modelLabel,
      toolCount: stepTools.length,
      parallelGroup: snapshot.stepParallelGroups[String(index)] || undefined,
      condition: snapshot.stepConditions[String(index)] || undefined,
      expectedArtifact: snapshot.stepExpectedArtifacts[String(index)] || undefined,
      level: pos.level,
      x: pos.x,
      y: pos.y,
    };
  });

  return {
    nodes,
    edges,
    title: snapshot.title,
    result: snapshot.result,
    statusText: snapshot.statusText,
    progressLabel: `${snapshot.progress.completed}/${snapshot.progress.total}`,
  };
}

export function buildStepToolDetail(params: {
  node: DagGraphNode;
  toolCalls: ToolCallTrace[];
  registry: AgentRegistry;
}): StepToolDetail {
  const { node, toolCalls, registry } = params;
  const tools = toolCalls
    .filter((tool) => tool.stepIndex === node.stepIndex)
    .map((tool) => {
      const { toolLabel, apiLabel } = resolveToolLabel(registry, tool.toolName);
      return {
        id: tool.id,
        toolName: tool.toolName,
        toolLabel: tool.toolLabel ?? toolLabel,
        apiLabel,
        status: tool.status,
        summary: tool.errorDetail ? `失败：${tool.errorDetail}` : tool.summary,
        duration: tool.duration,
        argsPreview: tool.argsPreview,
        timestamp: tool.timestampLabel,
        capabilityId: tool.capabilityId,
        resultType: tool.resultType,
        resultData: tool.resultData,
        sources: tool.sources,
        artifacts: tool.artifacts,
        metrics: tool.metrics,
        runtimeAgentId: tool.runtimeAgentId,
      };
    });

  return {
    stepIndex: node.stepIndex,
    stepTitle: node.title,
    agentId: node.agentId,
    agentLabel: node.agentLabel,
    capabilityId: node.capabilityId,
    capabilityLabel: node.capabilityLabel,
    modelLabel: node.modelLabel,
    parallelGroup: node.parallelGroup,
    condition: node.condition,
    expectedArtifact: node.expectedArtifact,
    note: node.note,
    status: node.status,
    tools,
  };
}

export function deriveStepsFromSnapshot(params: {
  snapshot: PlanSnapshot | null;
  toolCalls: ToolCallTrace[];
  registry: AgentRegistry;
  hasCompletedSession?: boolean;
}): Omit<AgentStep, 'agent'>[] {
  const layout = buildDagGraphLayout(params);
  if (!layout) return [];

  return layout.nodes.map((node) => ({
    id: `step-${node.id}`,
    stepIndex: node.stepIndex,
    title: node.title,
    status: node.status,
    summary: node.note || (node.status === 'running' ? '当前阶段正在办理。' : '阶段已记录。'),
    timestamp: Date.now(),
  }));
}

export function executionSnapshotToPlanSnapshot(snapshot: ExecutionSnapshot): PlanSnapshot {
  const stepStatuses = snapshot.steps.reduce<PlanSnapshot['stepStatuses']>((acc, step) => {
    acc[step.title] = step.status as PlanSnapshot['stepStatuses'][string];
    return acc;
  }, {});
  const stepNotes = snapshot.steps.reduce<Record<string, string>>((acc, step) => {
    if (step.note) acc[step.title] = step.note;
    return acc;
  }, {});

  return {
    title: snapshot.title,
    taskQuery: snapshot.taskQuery,
    steps: snapshot.steps.map((step) => step.title),
    stepStatuses,
    stepNotes,
    dependencies: snapshot.dependencies ?? {},
    stepAgentIds: snapshot.stepAgentIds ?? {},
    stepParallelGroups: snapshot.stepParallelGroups ?? {},
    stepConditions: snapshot.stepConditions ?? {},
    stepExpectedArtifacts: snapshot.stepExpectedArtifacts ?? {},
    selectedAgents: snapshot.selectedAgents ?? [],
    skippedAgents: snapshot.skippedAgents ?? [],
    scenario: snapshot.scenario ?? '',
    targetOutput: snapshot.targetOutput ?? '',
    riskLevel: snapshot.riskLevel ?? 'medium',
    progress: {
      total: snapshot.progress?.total ?? snapshot.steps.length,
      completed: snapshot.progress?.completed ?? snapshot.stats.completedSteps,
    },
    result: snapshot.result ?? '',
    statusText: snapshot.statusText ?? '',
  };
}

export function executionToolsToToolCalls(tools: ExecutionSnapshot['tools']): ToolCallTrace[] {
  return tools.map((tool, index) => ({
    id: `${tool.toolName}-${index}`,
    stepIndex: tool.stepIndex,
    toolName: tool.toolName,
    status: (tool.status ?? 'completed') as AgentStepStatus,
    summary: tool.summary,
    timestamp: Date.now() - index,
    agent: 'analysis',
    duration: tool.duration,
    timestampLabel: tool.timestamp,
    capabilityId: tool.capabilityId,
    resultType: tool.resultType,
    runtimeAgentId: tool.runtimeAgentId,
    resultData: tool.resultData,
    sources: tool.sources,
    artifacts: tool.artifacts,
    metrics: tool.metrics,
  }));
}

export function buildDagGraphFromExecutionSnapshot(snapshot: ExecutionSnapshot, registry: AgentRegistry): DagGraphLayout | null {
  return buildDagGraphLayout({
    snapshot: executionSnapshotToPlanSnapshot(snapshot),
    toolCalls: executionToolsToToolCalls(snapshot.tools),
    registry,
    hasCompletedSession: true,
  });
}

export function buildWorkflowPreviewLayout(workflow: WorkflowConfig, registry: AgentRegistry): DagGraphLayout | null {
  const dagNodes = workflow.dag?.nodes ?? [];
  if (dagNodes.length === 0) return null;

  const idMap = new Map(dagNodes.map((node, index) => [node.id, index + 1]));
  const steps = dagNodes.map((node) => node.label);
  const dependencies: Record<string, number[]> = {};

  (workflow.dag?.edges ?? []).forEach((edge) => {
    const target = idMap.get(edge.to);
    const source = idMap.get(edge.from);
    if (!target || !source) return;
    const key = String(target - 1);
    dependencies[key] = [...(dependencies[key] ?? []), source - 1];
  });

  const snapshot: PlanSnapshot = {
    title: '法律事项路径预览',
    steps,
    stepStatuses: Object.fromEntries(steps.map((step, index) => [step, index === 0 ? 'in_progress' : 'not_started'])),
    stepNotes: {},
    dependencies,
    stepAgentIds: Object.fromEntries(dagNodes.map((node, index) => [String(index), node.agent ?? ''])),
    stepParallelGroups: {},
    stepConditions: Object.fromEntries(dagNodes.map((node, index) => [String(index), node.condition ?? '']).filter(([, value]) => value)),
    stepExpectedArtifacts: {},
    selectedAgents: [...new Set(dagNodes.map((node) => node.agent).filter((value): value is string => Boolean(value)))],
    skippedAgents: [],
    scenario: '',
    targetOutput: '',
    riskLevel: 'medium',
    progress: { total: steps.length, completed: 0 },
    result: '',
    statusText: '提交事项后生成真实办理路径',
  };

  return buildDagGraphLayout({
    snapshot,
    toolCalls: [],
    registry,
    hasCompletedSession: false,
  });
}
