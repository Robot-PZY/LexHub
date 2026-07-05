import type { ToolCallTrace } from '../types/chat';
import type { AgentRegistry, RegisteredAgent } from '../types/agent-registry';
import { getAgentById } from './agent-registry';

export type AtomicCapability = {
  id: string;
  label: string;
  agentId: string;
  keywords: string[];
  toolHints: string[];
};

export const ATOMIC_CAPABILITIES: AtomicCapability[] = [
  { id: 'plan', label: '任务拆解', agentId: 'planner', keywords: ['规划', '拆解', '理解任务'], toolHints: [] },
  { id: 'material_parse', label: '材料解析', agentId: 'evidence', keywords: ['阅读', '解析', 'OCR', '上传材料'], toolHints: ['file_read', 'read_file', 'file_upload'] },
  { id: 'fact_extract', label: '事实抽取', agentId: 'evidence', keywords: ['事实', '争议焦点', '整理', '梳理', '收集', '归纳'], toolHints: [] },
  { id: 'evidence_match', label: '证据匹配', agentId: 'evidence', keywords: ['证据', '待证', '匹配', '缺口', '清单', '补充'], toolHints: [] },
  { id: 'legal_retrieval', label: '法规检索', agentId: 'research', keywords: ['检索', '法条', '法规', '依据', '案例', '研究'], toolHints: ['legal_search', 'legal_rag', 'tavily', 'google', 'search', 'wiki'] },
  { id: 'risk_assess', label: '风险研判', agentId: 'research', keywords: ['风险', '条款', '违约', '审查', '评估'], toolHints: [] },
  { id: 'document_draft', label: '文书起草', agentId: 'drafting', keywords: ['生成', '起草', '报告', '律师函', '文书', '写入', '导出'], toolHints: ['file_write', 'file_saver'] },
  { id: 'cross_review', label: '交叉审查', agentId: 'review', keywords: ['复核', '一致性', '可信度'], toolHints: ['credibility'] },
  { id: 'compliance_gate', label: '合规归档', agentId: 'compliance', keywords: ['归档', '审计', '合规监测'], toolHints: ['export', 'audit'] },
];

function scoreKeywords(text: string, keywords: string[]): number {
  return keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0);
}

function matchCapabilityByTools(stepTools: ToolCallTrace[]): AtomicCapability | null {
  const names = stepTools.map((tool) => tool.toolName.toLowerCase()).join(' ');

  if (/file_write|file_saver|save_file/.test(names)) {
    return ATOMIC_CAPABILITIES.find((item) => item.id === 'document_draft') ?? null;
  }

  if (/legal_search|legal_rag|tavily|google|search|wiki/.test(names)) {
    return ATOMIC_CAPABILITIES.find((item) => item.id === 'legal_retrieval') ?? null;
  }

  if (/file_read|read_file|file_upload/.test(names) && !/legal_search|search/.test(names)) {
    return ATOMIC_CAPABILITIES.find((item) => item.id === 'material_parse') ?? null;
  }

  if (/credibility/.test(names)) {
    return ATOMIC_CAPABILITIES.find((item) => item.id === 'cross_review') ?? null;
  }

  if (/export|audit/.test(names)) {
    return ATOMIC_CAPABILITIES.find((item) => item.id === 'compliance_gate') ?? null;
  }

  return null;
}

export function resolveCapabilityForStep(stepTitle: string, stepTools: ToolCallTrace[]): AtomicCapability {
  const title = stepTitle.trim();

  let best = ATOMIC_CAPABILITIES.find((item) => item.id === 'fact_extract')!;
  let bestScore = 0;

  ATOMIC_CAPABILITIES.forEach((capability) => {
    const score = scoreKeywords(title, capability.keywords);
    if (score > bestScore) {
      bestScore = score;
      best = capability;
    }
  });

  if (bestScore > 0) return best;

  const toolMatch = matchCapabilityByTools(stepTools);
  if (toolMatch) return toolMatch;

  if (stepTools.length === 0) return best;

  return ATOMIC_CAPABILITIES.find((item) => item.id === 'legal_retrieval') ?? best;
}

export function resolveAgentForStep(params: {
  registry: AgentRegistry;
  stepTitle: string;
  stepIndex: number;
  stepCount: number;
  toolCalls: ToolCallTrace[];
}): { agent: RegisteredAgent; capability: AtomicCapability } {
  const { registry, stepTitle, stepIndex, stepTools } = {
    ...params,
    stepTools: params.toolCalls.filter((tool) => tool.stepIndex === params.stepIndex),
  };

  const capability = stepIndex === 0 && scoreKeywords(stepTitle, ['规划', '拆解']) === 0
    ? resolveCapabilityForStep(stepTitle, stepTools)
    : resolveCapabilityForStep(stepTitle, stepTools);

  const agent = getAgentById(registry, capability.agentId)
    ?? getAgentById(registry, 'evidence')
    ?? registry.agents[0];

  return { agent, capability };
}
