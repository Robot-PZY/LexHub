import type { MembershipTier, MembershipTierMeta } from '../types/membership';

export type MembershipPlanDetail = MembershipTierMeta & {
  priceLabel: string;
  priceNote: string;
  periodLabel: string;
  features: string[];
  cta: string;
};

export const MEMBERSHIP_TIERS: MembershipTierMeta[] = [
  {
    id: 'trial',
    label: '体验版',
    shortLabel: '体验',
    description: '功能精简，用于体验 Co-Sight 编排与基础流程。',
    tone: 'muted',
  },
  {
    id: 'pro',
    label: '专业版',
    shortLabel: 'Pro',
    description: '功能全开，覆盖标准法律任务闭环。',
    tone: 'primary',
  },
  {
    id: 'ultra',
    label: '旗舰版',
    shortLabel: 'Ultra',
    description: '在专业版基础上提供更高用量与深度增值能力（规划）。',
    tone: 'success',
  },
];

export const MEMBERSHIP_TIER_MAP = Object.fromEntries(
  MEMBERSHIP_TIERS.map((tier) => [tier.id, tier]),
) as Record<MembershipTier, MembershipTierMeta>;

export const MEMBERSHIP_PLANS: MembershipPlanDetail[] = [
  {
    ...MEMBERSHIP_TIERS[0],
    priceLabel: '免费',
    priceNote: '适合初次体验',
    periodLabel: '永久体验额度',
    features: ['基础任务体验', 'DAG 执行预览', '回放记录查看', '材料库归档'],
    cta: '当前体验',
  },
  {
    ...MEMBERSHIP_TIERS[1],
    priceLabel: '¥199',
    priceNote: '按月计费（演示）',
    periodLabel: '/ 月',
    features: ['法律智能体协同', '完整 DAG 动态编排', 'DOCX / PDF 导出', '回放与材料归档', '法规混合检索'],
    cta: '升级专业版',
  },
  {
    ...MEMBERSHIP_TIERS[2],
    priceLabel: '¥499',
    priceNote: '按月计费（演示）',
    periodLabel: '/ 月',
    features: ['Pro 全部能力', '更高任务额度', '高级工具包', '优先调度', '机构协作席位（规划）'],
    cta: '升级旗舰版',
  },
];

export function getMembershipTierMeta(tier: MembershipTier): MembershipTierMeta {
  return MEMBERSHIP_TIER_MAP[tier];
}

export function getMembershipPlan(tier: MembershipTier): MembershipPlanDetail {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === tier) ?? MEMBERSHIP_PLANS[0];
}
