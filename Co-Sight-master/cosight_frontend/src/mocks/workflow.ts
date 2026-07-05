import type { PerformanceBenchmark, WorkflowConfig } from '../types/workflow';

export const mockWorkflowConfig: WorkflowConfig = {
  name: 'lexhub-legal-workflow',
  version: '1.0.0',
  framework: 'Co-Sight',
  description: '律枢 LexHub 法律任务动态编排工作流配置',
  agents: [
    { id: 'planner', name: '任务理解智能体', modelEnv: 'PLAN_MODEL_NAME', trigger: '任务提交' },
    { id: 'evidence', name: '证据质检智能体', modelEnv: 'VISION_MODEL_NAME', trigger: '材料完整度不足' },
    { id: 'research', name: '法规研究智能体', modelEnv: 'TOOL_MODEL_NAME', trigger: '法规引用缺失' },
    { id: 'drafting', name: '文书生成智能体', modelEnv: 'ACT_MODEL_NAME', trigger: '目标产出明确' },
    { id: 'review', name: '交叉审查智能体', modelEnv: 'REVIEW_MODEL_NAME', trigger: '高风险或导出前' },
  ],
  dag: {
    nodes: [
      { id: 'intake', label: '任务理解', agent: 'planner' },
      { id: 'evidence', label: '证据质检', agent: 'evidence', condition: 'materialCompleteness < 70' },
      { id: 'research', label: '法规研究', agent: 'research', condition: 'citationCoverage < 55' },
      { id: 'drafting', label: '文书生成', agent: 'drafting', condition: 'wantsOutput == true' },
      { id: 'review', label: '交叉审查', agent: 'review', condition: 'riskLevel == high || exportReady' },
    ],
    edges: [
      { from: 'intake', to: 'evidence', type: 'conditional' },
      { from: 'intake', to: 'research', type: 'conditional' },
      { from: 'evidence', to: 'research', type: 'sequential' },
      { from: 'research', to: 'drafting', type: 'conditional' },
      { from: 'drafting', to: 'review', type: 'mandatory' },
    ],
  },
  routingRules: [
    '材料完整度低于 70%，优先调度证据质检智能体',
    '法规引用缺失，调度法规研究智能体',
    '目标产出为报告/律师函，调度文书生成智能体',
    '高风险或导出前，强制调度交叉审查智能体',
  ],
};

export const mockPerformanceBenchmark: PerformanceBenchmark = {
  title: 'Co-Sight 多智能体 vs 传统人工流程',
  metrics: [
    { label: '单任务完成时间', traditional: '45 分钟', cosight: '12 分钟', improvement: '73%', unit: '时间' },
    { label: '材料完整度识别', traditional: '人工抽检', cosight: '自动质检 + 缺口清单', improvement: '结构化', unit: '质量' },
    { label: '法规引用可追溯率', traditional: '约 60%', cosight: '约 88%', improvement: '+28%', unit: '准确率' },
    { label: '过程可复核性', traditional: '邮件/文档分散', cosight: '全链路回放', improvement: '100% 归档', unit: '可信度' },
  ],
  summary: {
    efficiencyGain: '73%',
    accuracyGain: '28%',
    replayCoverage: '100%',
  },
};
