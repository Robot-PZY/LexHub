import type { AgentStepStatus } from './chat';

export type PlanStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'not_started' | 'in_progress' | 'blocked';

export type PlanSnapshot = {
  title: string;
  taskQuery?: string;
  steps: string[];
  stepStatuses: Record<string, PlanStepStatus>;
  stepNotes: Record<string, string>;
  dependencies: Record<string, number[]>;
  stepAgentIds: Record<string, string>;
  stepParallelGroups: Record<string, string>;
  stepConditions: Record<string, string>;
  stepExpectedArtifacts: Record<string, string>;
  selectedAgents: string[];
  skippedAgents: Array<{ agentId: string; reason: string }>;
  scenario: string;
  targetOutput: string;
  riskLevel: string;
  progress: { total: number; completed: number; in_progress?: number; blocked?: number; not_started?: number };
  result: string;
  statusText: string;
};

export type DagGraphEdge = {
  id: string;
  source: number;
  target: number;
  type: 'dependency' | 'sequential';
};

export type DagGraphNode = {
  id: number;
  stepIndex: number;
  title: string;
  status: AgentStepStatus;
  rawStatus: string;
  note: string;
  agentId: string;
  agentLabel: string;
  capabilityId: string;
  capabilityLabel: string;
  modelLabel?: string;
  parallelGroup?: string;
  condition?: string;
  expectedArtifact?: string;
  toolCount: number;
  level: number;
  x: number;
  y: number;
};

export type DagGraphLayout = {
  nodes: DagGraphNode[];
  edges: DagGraphEdge[];
  title: string;
  result: string;
  statusText: string;
  progressLabel: string;
};

export type StepToolDetail = {
  stepIndex: number;
  stepTitle: string;
  agentId: string;
  agentLabel: string;
  capabilityId: string;
  capabilityLabel: string;
  modelLabel?: string;
  parallelGroup?: string;
  condition?: string;
  expectedArtifact?: string;
  note: string;
  status: AgentStepStatus;
  tools: Array<{
    id: string;
    toolName: string;
    toolLabel: string;
    apiLabel: string;
    status: AgentStepStatus;
    summary: string;
    duration?: number;
    argsPreview?: string;
    timestamp?: string;
    capabilityId?: string;
    resultType?: string;
    resultData?: unknown;
    sources?: Array<Record<string, unknown>>;
    artifacts?: Array<Record<string, unknown>>;
    metrics?: Record<string, unknown>;
    runtimeAgentId?: string;
  }>;
};
