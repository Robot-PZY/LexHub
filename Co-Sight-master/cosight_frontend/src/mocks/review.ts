import type { ReviewResult } from '../types/review';

export const mockReviewResult: ReviewResult = {
  overallVerdict: '草稿可用，导出前需人工复核',
  reviewItems: [
    { label: '事实一致性', value: '通过', detail: '主体、金额、履行节点暂未发现明显冲突。', tone: 'success' },
    { label: '证据支撑性', value: '需补证', detail: '解除依据与付款违约仍需补充原始凭证。', tone: 'warning' },
    { label: '法规适配性', value: '待引用', detail: '结论摘要需要绑定具体法规条款或案例来源。', tone: 'warning' },
    { label: '文书完整性', value: '草稿可用', detail: '建议导出前补充事实时间线与附件清单。', tone: 'primary' },
  ],
  riskFindings: [
    '“可直接解除合同”的表述风险较高，建议改为“在满足约定或法定条件后可考虑解除”。',
    '付款记录与合同约定节点尚未完全对应，索赔金额需要人工确认。',
    '引用来源未完全落到条款级，正式报告应补充具体依据。',
  ],
  stats: { dimensions: 4, passed: 1, warnings: 2, outputLevel: '草稿' },
};
