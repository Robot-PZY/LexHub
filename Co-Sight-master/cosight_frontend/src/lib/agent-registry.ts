import type { AgentRegistry, RegisteredAgent, ToolCatalogEntry } from '../types/agent-registry';
import type { ToolCallTrace } from '../types/chat';
import { resolveAgentForStep as resolveAgentByCapability } from './agent-capabilities';

export const defaultAgentRegistry: AgentRegistry = {
  name: 'lexhub-agent-registry',
  version: '1.0.0',
  framework: 'LexHub',
  agents: [
    { id: 'planner', name: '事项受理角色', role: 'orchestrator', modelLabel: 'DeepSeek / Plan', capabilities: ['事项拆解'], registeredTools: [], triggers: ['事项提交'] },
    { id: 'evidence', name: '证据质检角色', role: 'worker', modelLabel: 'Vision 模型', capabilities: ['材料质检'], registeredTools: ['file_read', 'file_upload'], triggers: ['材料不足'] },
    { id: 'research', name: '法规研究角色', role: 'worker', modelLabel: 'DeepSeek / Research', capabilities: ['法规检索'], registeredTools: ['legal_search', 'legal_rag', 'tavily_search', 'search_google'], triggers: ['引用缺失'] },
    { id: 'drafting', name: '文书生成角色', role: 'worker', modelLabel: 'DeepSeek / Draft', capabilities: ['文书生成'], registeredTools: ['file_write', 'execute_code'], triggers: ['产出明确'] },
    { id: 'review', name: '结论复核角色', role: 'reviewer', modelLabel: 'DeepSeek / Review', capabilities: ['结论复核'], registeredTools: ['credibility_analysis'], triggers: ['导出前'] },
    { id: 'compliance', name: '合规监测角色', role: 'reviewer', modelLabel: 'DeepSeek / Compliance', capabilities: ['审计链'], registeredTools: ['audit_log', 'export'], triggers: ['导出前'] },
  ],
  toolCatalog: [
    { id: 'tavily_search', label: 'Tavily 联网搜索', category: 'search', apiLabel: 'Tavily API' },
    { id: 'search_google', label: 'Google 搜索', category: 'search', apiLabel: 'Google API' },
    { id: 'legal_search', label: '法律法规检索', category: 'legal', apiLabel: '得理 + NPC + Chroma' },
    { id: 'legal_rag', label: '法规 RAG', category: 'legal', apiLabel: '向量库 / LEGAL_SEARCH_API' },
    { id: 'execute_code', label: '结构化处理', category: 'code', apiLabel: '处理服务' },
    { id: 'file_write', label: '文档写入', category: 'document', apiLabel: '工作区文件' },
    { id: 'export', label: '文书导出', category: 'export', apiLabel: 'Export API' },
  ],
};

const agentMap = () => new Map(defaultAgentRegistry.agents.map((agent) => [agent.id, agent]));

export function mergeAgentRegistry(remote?: AgentRegistry | null): AgentRegistry {
  if (!remote?.agents?.length) return defaultAgentRegistry;
  return remote;
}

export function getAgentById(registry: AgentRegistry, agentId: string): RegisteredAgent | undefined {
  return registry.agents.find((agent) => agent.id === agentId);
}

export function getToolCatalogEntry(registry: AgentRegistry, toolName: string): ToolCatalogEntry | undefined {
  const normalized = toolName.toLowerCase();
  return registry.toolCatalog.find((tool) => {
    const id = tool.id.toLowerCase();
    return normalized === id || normalized.includes(id) || id.includes(normalized.replace(/_/g, ''));
  });
}

export function resolveToolLabel(registry: AgentRegistry, toolName: string): { toolLabel: string; apiLabel: string } {
  const entry = getToolCatalogEntry(registry, toolName);
  if (entry) {
    return { toolLabel: entry.label, apiLabel: entry.apiLabel };
  }
  return { toolLabel: toolName, apiLabel: '处理服务' };
}

export function resolveAgentForStep(params: {
  registry: AgentRegistry;
  stepTitle: string;
  stepIndex: number;
  stepCount: number;
  toolCalls: ToolCallTrace[];
}): RegisteredAgent {
  return resolveAgentByCapability(params).agent;
}

export function resolveStepAssignment(params: {
  registry: AgentRegistry;
  stepTitle: string;
  stepIndex: number;
  stepCount: number;
  toolCalls: ToolCallTrace[];
}): { agent: RegisteredAgent; capabilityLabel: string; capabilityId: string } {
  const { agent, capability } = resolveAgentByCapability(params);
  return {
    agent,
    capabilityLabel: capability.label,
    capabilityId: capability.id,
  };
}

export function listRegisteredAgents(registry: AgentRegistry = defaultAgentRegistry) {
  return registry.agents;
}

export { agentMap };
