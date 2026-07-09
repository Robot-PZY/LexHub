import { RefreshCw, RotateCcw, Users } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import MembershipBadge from '../../components/membership/MembershipBadge';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { MEMBERSHIP_TIERS } from '../../config/membership';
import { useMembershipUsers } from '../../hooks/useMembershipUsers';
import { resetDemoMaterials } from '../../lib/api';
import { resetDemoRuntimeData } from '../../lib/storage';
import type { MembershipTier } from '../../types/membership';

function formatTime(timestamp?: number): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabels: Record<string, string> = {
  active: '正常',
  trial: '体验中',
  inactive: '已停用',
};

function AdminUsersPage() {
  const { users, tierCounts, savedHint, refresh, updateUserTier } = useMembershipUsers();

  const handleResetUsers = async () => {
    resetDemoRuntimeData({ clearProfile: true });
    await resetDemoMaterials().catch(() => undefined);
    refresh();
  };

  return (
    <AdminShell
      title="用户与会员"
      subtitle="管理用户账号与会员等级标注。"
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={() => void handleResetUsers()}>
            <RotateCcw size={16} />
            重置用户库
          </button>
          <button type="button" className="btn btn-secondary" onClick={refresh}>
            <RefreshCw size={16} />
            刷新
          </button>
        </>
      )}
    >
      <PageHeader
        icon={Users}
        title="用户与会员管理"
        subtitle="查看并调整用户会员等级。当前用户库含 8 个预置体验账号。"
      />

      {savedHint && <div className="admin-save-hint">{savedHint}</div>}

      <section className="feature-stat-grid">
        <StatCard label="用户总数" value={`${users.length}`} description="已注册用户" />
        <StatCard label="体验版" value={`${tierCounts.trial}`} description="Trial" />
        <StatCard label="专业版" value={`${tierCounts.pro}`} description="Pro" />
        <StatCard label="旗舰版" value={`${tierCounts.ultra}`} description="Ultra" />
      </section>

      <section className="ds-card admin-panel admin-panel-wide">
        <div className="admin-panel-head-inline">
          <div>
            <p className="eyebrow">MEMBERSHIP REGISTRY</p>
            <strong>用户列表</strong>
          </div>
          <span className="ds-badge ds-badge-success">等级标注</span>
        </div>

        <div className="membership-tier-legend">
          {MEMBERSHIP_TIERS.map((tier) => (
            <article key={tier.id}>
              <MembershipBadge tier={tier.id} />
              <span>{tier.description}</span>
            </article>
          ))}
        </div>

        <div className="admin-users-table">
          <div className="admin-users-table-head">
            <span>用户</span>
            <span>机构</span>
            <span>会员等级</span>
            <span>状态</span>
            <span>最近活跃</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="admin-users-table-row">
              <div>
                <strong>{user.name}</strong>
                <em>{user.account}</em>
              </div>
              <span>{user.organization || '—'}</span>
              <select
                value={user.tier}
                onChange={(event) => updateUserTier(user.id, event.target.value as MembershipTier)}
                aria-label={`${user.name} 会员等级`}
              >
                {MEMBERSHIP_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>{tier.label}</option>
                ))}
              </select>
              <span className={`membership-status membership-status-${user.status}`}>
                {statusLabels[user.status] ?? user.status}
              </span>
              <span>{formatTime(user.lastActiveAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminUsersPage;
