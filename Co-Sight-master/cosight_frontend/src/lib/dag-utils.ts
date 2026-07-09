import type { AgentStep, ToolCallTrace } from '../types/chat';

export type DagNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'branch';

export type DagNode = {
  id: string;
  label: string;
  status: DagNodeStatus;
  hop: number;
  agent?: string;
  summary?: string;
  tools: string[];
};

const LEGAL_AGENT_LABELS: Record<string, string> = {
  planner: '事项受理角色',
  retrieval: '法规研究角色',
  research: '法规研究角色',
  analysis: '风险分析角色',
  generation: '文书生成角色',
  drafting: '文书生成角色',
  review: '结论复核角色',
  evidence: '证据质检角色',
};

export function formatLegalAgentLabel(agent?: string) {
  if (!agent) return '系统研判角色';
  return LEGAL_AGENT_LABELS[agent] ?? agent;
}

export function deriveDagNodes(steps: AgentStep[], toolCalls: ToolCallTrace[]): DagNode[] {
  if (steps.length === 0) {
    return [
      { id: 'intake', label: '事项受理', status: 'branch', hop: 1, agent: 'planner', summary: '识别场景与目标产出', tools: [] },
      { id: 'evidence', label: '证据质检', status: 'branch', hop: 2, agent: 'evidence', summary: '材料不足时触发', tools: [] },
      { id: 'research', label: '法规研究', status: 'branch', hop: 3, agent: 'retrieval', summary: '引用不足时触发', tools: [] },
      { id: 'drafting', label: '文书生成', status: 'branch', hop: 4, agent: 'generation', summary: '目标明确时触发', tools: [] },
      { id: 'review', label: '交叉审查', status: 'branch', hop: 5, agent: 'review', summary: '高风险/导出前强制复核', tools: [] },
    ];
  }

  return steps.map((step, index) => {
    const relatedTools = toolCalls
      .filter((tool) => tool.stepIndex === step.stepIndex)
      .map((tool) => tool.toolName);
    return {
      id: step.id,
      label: step.title,
      status: step.status === 'running' ? 'running' : step.status === 'failed' ? 'failed' : 'completed',
      hop: index + 1,
      agent: step.agent,
      summary: step.summary,
      tools: relatedTools,
    };
  });
}

export function deriveAgentInvocations(steps: AgentStep[], toolCalls: ToolCallTrace[]) {
  const buckets = new Map<string, { agent: string; label: string; steps: number; tools: number; lastAction: string }>();

  const touch = (agent: string, kind: 'step' | 'tool', detail: string) => {
    const label = formatLegalAgentLabel(agent);
    const current = buckets.get(agent) ?? { agent, label, steps: 0, tools: 0, lastAction: detail };
    if (kind === 'step') current.steps += 1;
    if (kind === 'tool') current.tools += 1;
    current.lastAction = detail;
    buckets.set(agent, current);
  };

  steps.forEach((step) => touch(step.agent, 'step', `进入阶段：${step.title}`));
  toolCalls.forEach((tool) => touch(tool.agent, 'tool', `处理动作：${tool.toolName}`));

  if (buckets.size === 0) {
    return [];
  }

  return [...buckets.values()].sort((a, b) => (b.steps + b.tools) - (a.steps + a.tools));
}

export function countDagHops(nodes: DagNode[]) {
  return nodes.filter((node) => node.status !== 'skipped' && node.status !== 'branch').length || nodes.length;
}
