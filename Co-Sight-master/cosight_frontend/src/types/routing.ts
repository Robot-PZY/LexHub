export type AgentStatus = 'idle' | 'active' | 'completed' | 'skipped';

export type RoutedAgent = {
  id: string;
  name: string;
  status: AgentStatus;
  trigger: string;
  reason: string;
};

export type RoutingMetrics = {
  materialCompleteness: number;
  citationCoverage: number;
  riskLevel: 'low' | 'medium' | 'high';
  wantsOutput: boolean;
};

export type AgentRoutingState = {
  taskId: string;
  scenario: string;
  metrics: RoutingMetrics;
  activeAgents: RoutedAgent[];
  routingDecisions: string[];
  nextSuggestion: string;
  reviewRequired: boolean;
};

export type AgentRoutingApiResponse = {
  code: number;
  message?: string;
  data?: AgentRoutingState;
};
