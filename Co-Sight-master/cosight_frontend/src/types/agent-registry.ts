export type RegisteredAgent = {
  id: string;
  name: string;
  role: 'orchestrator' | 'worker' | 'reviewer';
  modelEnv?: string;
  modelLabel?: string;
  capabilities: string[];
  registeredTools: string[];
  triggers: string[];
};

export type ToolCatalogEntry = {
  id: string;
  label: string;
  category: string;
  apiLabel: string;
};

export type AgentRegistry = {
  name: string;
  version: string;
  framework: string;
  description?: string;
  agents: RegisteredAgent[];
  toolCatalog: ToolCatalogEntry[];
};

export type AgentRegistryApiResponse = {
  code: number;
  message?: string;
  data?: AgentRegistry;
};
