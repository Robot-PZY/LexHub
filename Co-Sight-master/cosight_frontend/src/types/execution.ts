export type ExecutionStep = {
  index: number;
  title: string;
  status: string;
  statusLabel: string;
  note?: string;
  agentId?: string;
  parallelGroup?: string;
  condition?: string;
  expectedArtifact?: string;
};

export type ExecutionToolRecord = {
  toolName: string;
  stepIndex: number | null;
  summary: string;
  status?: 'running' | 'completed' | 'failed';
  timestamp?: string;
  duration?: number;
  capabilityId?: string;
  resultType?: string;
  runtimeAgentId?: string;
  resultData?: unknown;
  sources?: Array<Record<string, unknown>>;
  artifacts?: Array<Record<string, unknown>>;
  metrics?: Record<string, unknown>;
};

export type ExecutionSnapshot = {
  title: string;
  taskQuery?: string;
  steps: ExecutionStep[];
  dependencies?: Record<string, number[]>;
  stepAgentIds?: Record<string, string>;
  stepParallelGroups?: Record<string, string>;
  stepConditions?: Record<string, string>;
  stepExpectedArtifacts?: Record<string, string>;
  selectedAgents?: string[];
  skippedAgents?: Array<{ agentId: string; reason: string }>;
  scenario?: string;
  targetOutput?: string;
  riskLevel?: string;
  progress?: {
    total?: number;
    completed?: number;
    in_progress?: number;
    blocked?: number;
    not_started?: number;
  };
  result?: string;
  statusText?: string;
  tools: ExecutionToolRecord[];
  toolSummary: Array<{ name: string; count: number }>;
  stats: {
    stepCount: number;
    toolCallCount: number;
    dagHopCount: number;
    completedSteps: number;
    messageCount: number;
  };
  source: 'live' | 'replay' | 'local';
  workspacePath?: string;
  replayFile?: string;
};

export type ExecutionSnapshotApiResponse = {
  code: number;
  message?: string;
  data?: ExecutionSnapshot;
};
