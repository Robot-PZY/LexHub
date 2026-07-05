export type MembershipTier = 'trial' | 'pro' | 'ultra';

export type MembershipUserStatus = 'active' | 'trial' | 'inactive';

export type MembershipUser = {
  id: string;
  name: string;
  account: string;
  organization?: string;
  tier: MembershipTier;
  status: MembershipUserStatus;
  createdAt: number;
  lastActiveAt?: number;
};

export type MembershipTierMeta = {
  id: MembershipTier;
  label: string;
  shortLabel: string;
  description: string;
  tone: 'muted' | 'primary' | 'success' | 'warning';
};
