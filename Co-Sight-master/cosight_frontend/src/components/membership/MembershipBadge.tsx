import { getMembershipTierMeta } from '../../config/membership';
import type { MembershipTier } from '../../types/membership';

type MembershipBadgeProps = {
  tier: MembershipTier;
  compact?: boolean;
};

function MembershipBadge({ tier, compact = false }: MembershipBadgeProps) {
  const meta = getMembershipTierMeta(tier);
  return (
    <span className={`membership-badge membership-badge-${meta.tone}`} title={meta.description}>
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

export default MembershipBadge;
