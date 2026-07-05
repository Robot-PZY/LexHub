export type ExecutionStep = {
  index: number;
  title: string;
  status: string;
  statusLabel: string;
  note?: string;
};

export type ExecutionToolRecord = {
  toolName: string;
  stepIndex: number | null;
  summary: string;
  timestamp?: string;
  duration?: number;
};

export type ExecutionSnapshot = {
  title: string;
  taskQuery?: string;
  steps: ExecutionStep[];
  dependencies?: Record<string, number[]>;
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
