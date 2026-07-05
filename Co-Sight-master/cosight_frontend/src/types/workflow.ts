export type WorkflowAgent = {
  id: string;
  name: string;
  modelEnv?: string;
  trigger?: string;
};

export type WorkflowDagNode = {
  id: string;
  label: string;
  agent: string;
  condition?: string;
};

export type WorkflowDagEdge = {
  from: string;
  to: string;
  type: string;
};

export type WorkflowTool = {
  id: string;
  category: string;
  envKeys?: string[];
  builtin?: boolean;
  endpoint?: string;
};

export type WorkflowConfig = {
  name: string;
  version: string;
  framework: string;
  description?: string;
  agents: WorkflowAgent[];
  dag?: {
    nodes: WorkflowDagNode[];
    edges: WorkflowDagEdge[];
  };
  tools?: WorkflowTool[];
  routingRules: string[];
};

export type WorkflowConfigApiResponse = {
  code: number;
  message?: string;
  data?: WorkflowConfig;
};

export type PerformanceMetric = {
  label: string;
  traditional: string;
  cosight: string;
  improvement: string;
  unit: string;
};

export type PerformanceBenchmark = {
  title: string;
  metrics: PerformanceMetric[];
  summary: {
    efficiencyGain: string;
    accuracyGain: string;
    replayCoverage: string;
  };
  dataSource?: 'replay' | 'baseline';
  sampleCount?: number;
  note?: string;
};

export type PerformanceBenchmarkApiResponse = {
  code: number;
  message?: string;
  data?: PerformanceBenchmark;
};
