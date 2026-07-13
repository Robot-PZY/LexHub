import type { AgentRoutingState } from '../types/routing';

export const mockAgentRouting: AgentRoutingState = {
  taskId: 'task-demo',
  scenario: 'contract_review',
  metrics: {
    materialCompleteness: 68,
    citationCoverage: 42,
    riskLevel: 'high',
    wantsOutput: true,
  },
  activeAgents: [
    { id: 'planner', name: '任务理解智能体', status: 'active', trigger: '任务提交', reason: '识别场景、目标产出与材料状态。' },
    { id: 'evidence', name: '证据质检智能体', status: 'active', trigger: '材料完整度 68%', reason: '优先补齐签署页与付款凭证。' },
    { id: 'research', name: '法规研究智能体', status: 'active', trigger: '法规引用度 42%', reason: '补充法规与案例引用。' },
    { id: 'drafting', name: '文书生成智能体', status: 'idle', trigger: '目标产出含报告', reason: '待证据与引用就绪后生成草稿。' },
    { id: 'review', name: '交叉审查智能体', status: 'active', trigger: '高风险/导出前', reason: '导出前强制交叉复核。' },
  ],
  routingDecisions: [
    '任务理解智能体常驻启动，负责拆解场景与目标产出。',
    '材料完整度低于 70%，优先调度证据质检智能体。',
    '法规引用不足，调度法规研究智能体补充依据。',
    '存在高风险或输出需求，强制进入交叉审查智能体。',
  ],
  nextSuggestion: '导出前完成自动交叉审查，并保留可追溯校验记录。',
  reviewRequired: true,
};

export const mockAgentCatalog = [
  { name: '任务理解智能体', trigger: '用户提交任务或补充材料', output: '场景、目标产出、材料状态、调度建议', status: '常驻调度' },
  { name: '证据质检智能体', trigger: '材料完整度不足或存在矛盾', output: '缺口清单、OCR 解析、证据支撑度', status: '条件触发' },
  { name: '法规研究智能体', trigger: '法律依据缺失或争议焦点复杂', output: '法规引用、案例线索、研究结论', status: '条件触发' },
  { name: '文书生成智能体', trigger: '用户目标包含报告、律师函、意见书', output: '结构化草稿、导出字段、归档摘要', status: '目标触发' },
  { name: '交叉审查智能体', trigger: '高风险、低置信度或即将导出', output: '事实一致性、引用匹配、幻觉风险、自动校验项', status: '强制校验' },
];
