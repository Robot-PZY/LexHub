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
    description: '功能精简，用于体验法律事项受理与基础办理流程。',
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
    features: ['基础事项受理', '办理路径预览', '归档记录查看', '材料库归档'],
    cta: '当前体验',
  },
  {
    ...MEMBERSHIP_TIERS[1],
    priceLabel: '¥199',
    priceNote: '按月计费（演示）',
    periodLabel: '/ 月',
    features: ['法律角色协同', '完整办理路径', 'DOCX / PDF 导出', '案件与材料归档', '法规混合检索'],
    cta: '升级专业版',
  },
  {
    ...MEMBERSHIP_TIERS[2],
    priceLabel: '¥499',
    priceNote: '按月计费（演示）',
    periodLabel: '/ 月',
    features: ['Pro 全部能力', '更高事项额度', '高级处理能力', '优先办理', '机构协作席位（规划）'],
    cta: '升级旗舰版',
  },
];

export function getMembershipTierMeta(tier: MembershipTier): MembershipTierMeta {
  return MEMBERSHIP_TIER_MAP[tier];
}

export function getMembershipPlan(tier: MembershipTier): MembershipPlanDetail {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === tier) ?? MEMBERSHIP_PLANS[0];
}
