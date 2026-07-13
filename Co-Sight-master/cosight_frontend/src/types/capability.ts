export type CapabilityStatus = 'running' | 'success' | 'failed' | 'degraded';

export type CapabilityResultType =
  | 'text'
  | 'structured_data'
  | 'structured_document'
  | 'search_results'
  | 'legal_citations'
  | 'calculation'
  | 'diff'
  | 'file'
  | 'image'
  | 'report'
  | 'verification';

export type CapabilityDefinition = {
  id: string;
  name: string;
  category: string;
  provider: string;
  description: string;
  allowedAgents: string[];
  resultType: CapabilityResultType;
  timeoutSeconds: number;
  maxRetries: number;
  fallbackCapabilityId?: string | null;
  enabled: boolean;
};

export type CapabilityResult = {
  invocationId: string;
  capabilityId: string;
  status: CapabilityStatus;
  summary: string;
  resultType: CapabilityResultType | string;
  data: unknown;
  artifacts: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  metrics: Record<string, unknown>;
  error: Record<string, unknown> | null;
  fallback: Record<string, unknown> | null;
};
