import type { ProfileAnalysis } from '../types/profile';

export const mockProfileAnalysis: ProfileAnalysis = {
  profileCards: [
    { title: '案件画像', items: ['争议类型：合同履行', '风险等级：中高', '处理目标：审查 + 发函准备'] },
    { title: '证据画像', items: ['完整度：68%', '强证据：合同文本', '弱证据：聊天截图与付款记录'] },
    { title: '主体画像', items: ['签约主体：合同载明双方', '材料一致性：待核对', '履约线索：付款与往来记录'] },
  ],
  dimensions: [
    { label: '材料完整度', value: '68%', tone: 'warning' },
    { label: '法规引用度', value: '42%', tone: 'warning' },
    { label: '输出可用度', value: '草稿', tone: 'primary' },
    { label: '自动校验等级', value: '增强', tone: 'warning' },
  ],
  externalData: [
    { label: '得理法规检索', status: '可接入' },
    { label: '联网搜索', status: '已就绪' },
    { label: '本地知识库', status: '待导入' },
  ],
  stats: {
    caseType: '合同争议',
    riskLevel: '中高',
    entityCheck: '材料核验',
    recommendedPath: '补证 + 审查',
  },
};
