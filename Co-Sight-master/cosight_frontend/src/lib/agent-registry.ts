import type { AgentRegistry, RegisteredAgent, ToolCatalogEntry } from '../types/agent-registry';
import type { ToolCallTrace } from '../types/chat';
import { resolveAgentForStep as resolveAgentByCapability } from './agent-capabilities';

export const defaultAgentRegistry: AgentRegistry = {
  name: 'lexhub-agent-registry',
  version: '1.0.0',
  framework: 'LexHub',
  agents: [
    { id: 'planner', name: '任务编排智能体', role: 'orchestrator', modelLabel: 'DeepSeek / Plan', capabilities: ['事项拆解', 'DAG 编排'], registeredTools: [], triggers: ['事项提交'] },
    { id: 'evidence', name: '材料证据智能体', role: 'worker', modelLabel: 'Vision / Act', capabilities: ['材料解析', '证据缺口'], registeredTools: ['file_read', 'extract_document_content'], triggers: ['存在上传材料'] },
    { id: 'issue_spotter', name: '法律争点智能体', role: 'worker', modelLabel: 'DeepSeek / Act', capabilities: ['法律关系', '争议焦点'], registeredTools: ['file_read'], triggers: ['需要法律判断'] },
    { id: 'research', name: '法规研究智能体', role: 'worker', modelLabel: 'DeepSeek / Tool', capabilities: ['法规检索', '引用溯源'], registeredTools: ['legal_search', 'tavily_search', 'search_wiki'], triggers: ['需要法律依据'] },
    { id: 'clause_risk', name: '条款风险智能体', role: 'worker', modelLabel: 'DeepSeek / Act', capabilities: ['合同风险', '版本差异'], registeredTools: ['contract_compare'], triggers: ['合同审查或起草'] },
    { id: 'calculation', name: '时效计算智能体', role: 'worker', modelLabel: 'DeepSeek / Act', capabilities: ['时效', '金额计算'], registeredTools: ['execute_code'], triggers: ['期限、利息或赔偿'] },
    { id: 'drafting', name: '文书生成智能体', role: 'worker', modelLabel: 'DeepSeek / Act', capabilities: ['文书生成'], registeredTools: ['file_saver', 'create_html_report'], triggers: ['目标产出明确'] },
    { id: 'verification', name: '质量校验智能体', role: 'reviewer', modelLabel: 'DeepSeek / Act', capabilities: ['事实一致性', '引用校验'], registeredTools: ['file_read', 'execute_code'], triggers: ['最终结果生成'] },
  ],
  toolCatalog: [
    { id: 'file_read', label: '材料读取', category: 'document', apiLabel: '工作区文件 / PDF 解析' },
    { id: 'extract_document_content', label: '百度 OCR 文档识别', category: 'document', apiLabel: '百度智能云 OCR' },
    { id: 'tavily_search', label: 'Tavily 联网搜索', category: 'search', apiLabel: 'Tavily API' },
    { id: 'search_wiki', label: '维基百科搜索', category: 'search', apiLabel: 'Wikipedia（无需 Key）' },
    { id: 'legal_search', label: '法律法规检索', category: 'legal', apiLabel: '得理 + NPC + Chroma' },
    { id: 'legal_rag', label: '法规 RAG', category: 'legal', apiLabel: '向量库 / LEGAL_SEARCH_API' },
    { id: 'contract_compare', label: '合同版本比对', category: 'legal', apiLabel: 'LexHub Local Capability' },
    { id: 'execute_code', label: '结构化处理', category: 'code', apiLabel: '处理服务' },
    { id: 'file_saver', label: '结果文件保存', category: 'document', apiLabel: '工作区文件' },
    { id: 'create_html_report', label: '审查报告生成', category: 'document', apiLabel: 'LexHub 文书引擎' },
    { id: 'baidu_textreview', label: '批注版合同交付', category: 'export', apiLabel: '百度 TextReview（可选）' },
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
