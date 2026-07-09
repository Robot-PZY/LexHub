import type { DocumentTemplateId } from '../types/export';

export type OutputPrimary = 'report' | 'review' | 'checklist' | 'research' | 'document';

export type ScenarioOutputProfile = {
  primary: OutputPrimary;
  showDeliverable: boolean;
  deliverableCollapsed: boolean;
  autoGenerate: boolean;
  primaryLabel: string;
  primaryHint: string;
};

export type ScenarioDocumentTemplate = {
  id: DocumentTemplateId;
  label: string;
  description: string;
};

export type ScenarioGroup = 'general' | 'legal';

export type ScenarioDefinition = {
  id: string;
  group: ScenarioGroup;
  title: string;
  description: string;
  examples: string[];
  placeholder: string;
  deliverables: ScenarioDocumentTemplate[];
  outputProfile: ScenarioOutputProfile;
};

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    id: 'general_analysis',
    group: 'general',
    title: '通用分析',
    description: '梳理事实、归纳问题、给出可执行建议（不限定法律子类）。',
    examples: ['请根据我提供的材料，归纳核心问题并给出下一步处理建议。'],
    placeholder: '描述你的目标与已知事实，系统将自动规划检索、分析与输出路径…',
    deliverables: [
      { id: 'task_summary_report', label: '事项总结报告', description: '归纳问题、过程与建议' },
    ],
    outputProfile: {
      primary: 'report',
      showDeliverable: false,
      deliverableCollapsed: false,
      autoGenerate: false,
      primaryLabel: '分析结论',
      primaryHint: '以事项报告为主交付，无需额外文书。',
    },
  },
  {
    id: 'material_digest',
    group: 'general',
    title: '材料解读',
    description: '解读上传文件，提取要点、时间线与待补充项。',
    examples: ['请阅读上传材料，提取关键事实、争议焦点与缺失信息。'],
    placeholder: '说明材料类型与关注重点（如付款节点、主体信息、时间线）…',
    deliverables: [
      { id: 'evidence_checklist', label: '证据清单', description: '材料要点与缺失项' },
      { id: 'task_summary_report', label: '材料解读报告', description: '结构化解读结论' },
    ],
    outputProfile: {
      primary: 'checklist',
      showDeliverable: true,
      deliverableCollapsed: true,
      autoGenerate: false,
      primaryLabel: '材料与证据',
      primaryHint: '主交付为材料要点与缺失项梳理。',
    },
  },
  {
    id: 'research_summary',
    group: 'general',
    title: '调研摘要',
    description: '结合公开检索与知识库，输出结构化调研结论。',
    examples: ['围绕「股权争议」检索公开依据，并输出调研摘要。'],
    placeholder: '列出调研主题、希望覆盖的信息维度与输出格式…',
    deliverables: [
      { id: 'legal_opinion_summary', label: '调研摘要', description: '法规与公开信息结论' },
      { id: 'task_summary_report', label: '事项总结报告', description: '完整过程与发现' },
    ],
    outputProfile: {
      primary: 'research',
      showDeliverable: true,
      deliverableCollapsed: true,
      autoGenerate: false,
      primaryLabel: '调研结论',
      primaryHint: '主交付为检索路径与调研摘要。',
    },
  },
  {
    id: 'contract_review',
    group: 'legal',
    title: '合同审查',
    description: '识别付款、违约、解除、争议解决、数据与知识产权条款风险。',
    examples: ['审查合作协议中的付款和违约责任风险。'],
    placeholder: '请描述合同类型与关注条款（付款、违约、解除、争议解决等）…',
    deliverables: [
      { id: 'contract_review_report', label: '合同审查报告', description: '条款风险与修改建议' },
      { id: 'clause_revision_memo', label: '条款修改备忘', description: '逐条修订与谈判要点' },
      { id: 'lawyer_letter_draft', label: '律师函初稿', description: '争议催告与主张（可选）' },
    ],
    outputProfile: {
      primary: 'review',
      showDeliverable: true,
      deliverableCollapsed: false,
      autoGenerate: true,
      primaryLabel: '审查结论与文书',
      primaryHint: '事项完成后将结合表单信息自动生成合同审查报告，可切换其他文书类型。',
    },
  },
  {
    id: 'corporate_affairs',
    group: 'legal',
    title: '公司事务',
    description: '梳理主体信息、股权结构、决议材料和治理合规风险。',
    examples: ['梳理股权争议材料并生成证据清单。'],
    placeholder: '请说明公司主体、股权或治理相关事实，以及手头已有材料…',
    deliverables: [
      { id: 'evidence_checklist', label: '治理材料清单', description: '决议、章程与证据缺口' },
      { id: 'legal_opinion_summary', label: '公司事务意见摘要', description: '治理风险与建议' },
    ],
    outputProfile: {
      primary: 'checklist',
      showDeliverable: true,
      deliverableCollapsed: true,
      autoGenerate: false,
      primaryLabel: '治理材料',
      primaryHint: '主交付为治理材料清单与合规缺口。',
    },
  },
  {
    id: 'dispute_resolution',
    group: 'legal',
    title: '争议解决',
    description: '形成事实时间线、证据清单、请求基础和下一步处理建议。',
    examples: ['整理争议事实并判断还缺哪些关键证据。'],
    placeholder: '请描述争议事实、时间线与诉求，系统将帮你梳理证据与策略…',
    deliverables: [
      { id: 'evidence_checklist', label: '证据清单', description: '已有/缺失证据梳理' },
      { id: 'lawyer_letter_draft', label: '律师函初稿', description: '催告与权利主张（可选）' },
    ],
    outputProfile: {
      primary: 'checklist',
      showDeliverable: true,
      deliverableCollapsed: true,
      autoGenerate: false,
      primaryLabel: '争议梳理',
      primaryHint: '主交付为事实时间线与证据清单，律师函按需生成。',
    },
  },
  {
    id: 'compliance_ip',
    group: 'legal',
    title: '合规知产',
    description: '核查监管要求、权利归属、授权边界与风险等级。',
    examples: ['围绕数据合规问题检索依据，并生成可复核的处理建议。'],
    placeholder: '请说明合规或知识产权问题背景，以及希望检索的依据与建议…',
    deliverables: [
      { id: 'legal_opinion_summary', label: '合规意见摘要', description: '监管与权属风险' },
      { id: 'task_summary_report', label: '合规审查报告', description: '完整审查过程' },
    ],
    outputProfile: {
      primary: 'review',
      showDeliverable: true,
      deliverableCollapsed: true,
      autoGenerate: false,
      primaryLabel: '合规审查',
      primaryHint: '主交付为合规风险等级与处理建议。',
    },
  },
  {
    id: 'legal_research',
    group: 'legal',
    title: '法规研究',
    description: '围绕具体问题组织法规、案例、公开资料和引用依据。',
    examples: ['检索劳动合同法相关条文与典型案例。'],
    placeholder: '请列出需要研究的法律问题或条文方向，以及引用与结论要求…',
    deliverables: [
      { id: 'legal_opinion_summary', label: '法律研究备忘录', description: '法条与案例引用' },
      { id: 'task_summary_report', label: '研究过程报告', description: '检索路径与结论' },
    ],
    outputProfile: {
      primary: 'research',
      showDeliverable: true,
      deliverableCollapsed: true,
      autoGenerate: false,
      primaryLabel: '研究备忘录',
      primaryHint: '主交付为法条引用与研究结论。',
    },
  },
  {
    id: 'document_draft',
    group: 'legal',
    title: '文书起草',
    description: '基于事实与法规检索，直接生成律师函、法律意见等可导出文书。',
    examples: ['根据争议事实起草律师函催告对方履行付款义务。'],
    placeholder: '说明文书类型、事实背景、诉求与语气要求…',
    deliverables: [
      { id: 'commercial_contract_draft', label: '商业合同草稿', description: '结构化合同正文' },
      { id: 'lawyer_letter_draft', label: '律师函初稿', description: '催告与权利主张' },
      { id: 'legal_opinion_summary', label: '法律意见摘要', description: '内部汇报用' },
    ],
    outputProfile: {
      primary: 'document',
      showDeliverable: true,
      deliverableCollapsed: false,
      autoGenerate: true,
      primaryLabel: '文书草稿',
      primaryHint: '主交付为可直接导出的正式文书。',
    },
  },
];

export function scenariosToLegalProfile() {
  return SCENARIO_DEFINITIONS.map(({ id, title, description, examples }) => ({
    id,
    title,
    description,
    examples,
  }));
}

export function findScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIO_DEFINITIONS.find((item) => item.id === id);
}

export function getScenarioOutputProfile(scenarioId?: string): ScenarioOutputProfile {
  return findScenario(scenarioId ?? '')?.outputProfile ?? {
    primary: 'report',
    showDeliverable: false,
    deliverableCollapsed: true,
    autoGenerate: false,
    primaryLabel: '办理结论',
    primaryHint: '以事项报告为主交付。',
  };
}
