import { useCallback, useEffect, useState } from 'react';
import {
  loadMembershipUsers,
  mergeCuratedMembershipUsers,
  setMembershipTierForAccount,
} from '../lib/storage';
import type { MembershipTier, MembershipUser } from '../types/membership';

export function useMembershipUsers() {
  const [users, setUsers] = useState<MembershipUser[]>([]);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  const refresh = useCallback(() => {
    mergeCuratedMembershipUsers();
    setUsers(loadMembershipUsers());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateUserTier = useCallback((userId: string, tier: MembershipTier) => {
    const current = loadMembershipUsers().find((user) => user.id === userId);
    if (!current) return;
    setMembershipTierForAccount(current.account, tier);
    setUsers(loadMembershipUsers());
    setSavedHint('会员等级已更新');
    window.setTimeout(() => setSavedHint(null), 2400);
  }, []);

  const tierCounts = users.reduce<Record<MembershipTier, number>>((acc, user) => {
    acc[user.tier] += 1;
    return acc;
  }, { trial: 0, pro: 0, ultra: 0 });

  return {
    users,
    tierCounts,
    savedHint,
    refresh,
    updateUserTier,
  };
}
