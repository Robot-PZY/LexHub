import type { ReportSummary } from '../types/report';

export const mockReportSummary: ReportSummary = {
  title: '合同审查任务总结报告',
  sections: [
    { title: '任务目标', desc: '审查合作协议中的付款、违约责任和争议解决条款风险。' },
    { title: '调度过程', desc: '系统先调用任务理解与证据质检，再进入法规研究、文书生成和交叉审查。' },
    { title: '证据结论', desc: '主体信息基本一致，但签署页、付款凭证和催告记录仍需补充。' },
    { title: '研究结论', desc: '当前可形成初步风险提示，正式意见需补充条款级法规引用。' },
    { title: '审查意见', desc: '解除、索赔等结论需要谨慎表述，并保留人工确认。' },
  ],
  agentInvocations: [
    { name: '任务理解智能体', count: 1 },
    { name: '证据质检智能体', count: 2 },
    { name: '法规研究智能体', count: 1 },
    { name: '文书生成智能体', count: 1 },
    { name: '交叉审查智能体', count: 1 },
  ],
  exportFormats: [
    { id: 'pdf', label: 'PDF 报告', status: 'ready' },
    { id: 'docx', label: 'DOCX 文书', status: 'ready' },
    { id: 'zip', label: '材料包 ZIP', status: 'planned' },
  ],
  nextActions: [
    { title: '补齐材料', desc: '补充签署页、付款凭证和催告记录。' },
    { title: '人工复核', desc: '确认解除、索赔和发函措辞。' },
    { title: '导出归档', desc: '生成报告并进入回放中心。' },
  ],
  stats: { agents: 5, findings: 7, status: '草稿' },
};
