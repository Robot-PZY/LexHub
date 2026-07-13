export type ChatStatus = 'idle' | 'connecting' | 'connected' | 'sending' | 'error';

export type AgentRole = 'planner' | 'retrieval' | 'analysis' | 'generation' | 'review';

export type AgentStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type AgentStep = {
  id: string;
  stepIndex: number;
  title: string;
  status: AgentStepStatus;
  summary: string;
  agent: AgentRole;
  timestamp: number;
};

export type ToolCallTrace = {
  id: string;
  stepIndex: number | null;
  toolName: string;
  toolLabel?: string;
  status: AgentStepStatus;
  summary: string;
  timestamp: number;
  agent: AgentRole;
  duration?: number;
  argsPreview?: string;
  timestampLabel?: string;
  errorDetail?: string;
  capabilityId?: string;
  resultType?: string;
  resultData?: unknown;
  sources?: Array<Record<string, unknown>>;
  artifacts?: Array<Record<string, unknown>>;
  metrics?: Record<string, unknown>;
  runtimeAgentId?: string;
};

export type ResultCredibility = {
  score: number;
  label: string;
  reviewLevel: 'low' | 'medium' | 'high';
  reviewLabel: string;
};

export type ResultInsight = {
  conclusion: string;
  risk: string;
  recommendation: string;
  evidenceReferences: string[];
  reviewNote: string;
  credibility: ResultCredibility;
};

export type AgentRuntimeCard = {
  id: AgentRole;
  label: string;
  description: string;
  status: 'idle' | 'active' | 'completed';
};

export type ChatMessage = {
  id: string;
  role: 'human' | 'system' | 'ai';
  content: string;
  topic?: string;
  timestamp: number;
  messageType?: string;
  data?: unknown;
};
