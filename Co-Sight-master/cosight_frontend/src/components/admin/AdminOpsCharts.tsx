import { PlugZap, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import DataSourceBadge from '../ui/DataSourceBadge';
import LoadingState from '../ui/LoadingState';
import MembershipBadge from '../membership/MembershipBadge';
import { useDemoResource } from '../../hooks/useDemoResource';
import { useMembershipUsers } from '../../hooks/useMembershipUsers';
import { fetchAnalyticsOverview } from '../../lib/api';
import { mockAnalyticsOverview } from '../../mocks/analytics';
import { MEMBERSHIP_TIERS } from '../../config/membership';
import type { MembershipTier } from '../../types/membership';

const TIER_COLORS: Record<MembershipTier, string> = {
  trial: 'rgba(100, 116, 139, 0.82)',
  pro: 'rgba(42, 127, 118, 0.88)',
  ultra: '#c9a227',
};

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '—';
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function buildPieGradient(counts: Record<MembershipTier, number>, total: number): string {
  if (total <= 0) return 'conic-gradient(#e2e8f0 0 100%)';
  let cursor = 0;
  const parts: string[] = [];
  MEMBERSHIP_TIERS.forEach((tier) => {
    const count = counts[tier.id];
    if (count <= 0) return;
    const pct = (count / total) * 100;
    const end = cursor + pct;
    parts.push(`${TIER_COLORS[tier.id]} ${cursor}% ${end}%`);
    cursor = end;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

function buildRegistrationTrend(users: Array<{ createdAt: number }>) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const dayStart = startOfToday - (6 - index) * dayMs;
    const dayEnd = dayStart + dayMs;
    const count = users.filter((user) => user.createdAt >= dayStart && user.createdAt < dayEnd).length;
    const weekday = new Date(dayStart).getDay();
    const label = WEEK_LABELS[weekday === 0 ? 6 : weekday - 1];
    return { label, value: count };
  });
  const total = buckets.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...buckets.map((item) => item.value), 1);
  return { buckets, max, total };
}

function AdminOpsCharts() {
  const { users, tierCounts, refresh } = useMembershipUsers();
  const { data, source, loading } = useDemoResource(fetchAnalyticsOverview, mockAnalyticsOverview);

  const tierTotal = users.length;
  const pieGradient = useMemo(
    () => buildPieGradient(tierCounts, tierTotal),
    [tierCounts, tierTotal],
  );
  const registrationTrend = useMemo(() => buildRegistrationTrend(users), [users]);
  const apiReady = data.apiStatus.filter((item) => item.status === 'ready').length;
  const apiTotal = data.apiStatus.length;
  const recentUsers = [...users]
    .sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0))
    .slice(0, 6);

  const activeCount = users.filter((user) => user.status === 'active' || user.status === 'trial').length;

  return (
    <section className="admin-ops-section">
      <div className="admin-ops-section-head">
        <div>
          <p className="eyebrow">OPS VISUALIZATION</p>
          <strong>运营可视化</strong>
          <span>会员结构、用户增长与系统连接状态</span>
        </div>
        <div className="admin-ops-section-actions">
          <DataSourceBadge source={source} />
          <button type="button" className="btn btn-ghost" onClick={refresh}>刷新用户</button>
        </div>
      </div>

      {loading ? <LoadingState label="加载运营数据…" /> : (
        <div className="admin-ops-grid">
          <article className="ds-card admin-ops-card">
            <div className="admin-ops-card-head">
              <Users size={16} />
              <strong>会员结构</strong>
              <em>{tierTotal} 位用户 · 活跃 {activeCount}</em>
            </div>
            <div className="admin-tier-pie-wrap">
              <div className="admin-tier-pie" style={{ background: pieGradient }} aria-hidden>
                <div className="admin-tier-pie-hole">
                  <strong>{tierTotal}</strong>
                  <span>总用户</span>
                </div>
              </div>
              <div className="admin-tier-legend admin-tier-legend-pie">
                {MEMBERSHIP_TIERS.map((tier) => {
                  const count = tierCounts[tier.id];
                  const pct = tierTotal > 0 ? Math.round((count / tierTotal) * 100) : 0;
                  return (
                    <div key={tier.id} className="admin-tier-legend-item">
                      <i style={{ background: TIER_COLORS[tier.id] }} />
                      <span>{tier.label}</span>
                      <em>{count} · {pct}%</em>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="ds-card admin-ops-card admin-ops-card-fill">
            <div className="admin-ops-card-head">
              <TrendingUp size={16} />
              <strong>近 7 日注册</strong>
              <em>本周新增 {registrationTrend.total} 人</em>
            </div>
            <div className="admin-mini-trend-chart admin-mini-trend-chart-fill">
              {registrationTrend.buckets.map((item) => {
                const heightPct = item.value > 0
                  ? Math.max((item.value / registrationTrend.max) * 100, 24)
                  : 6;
                return (
                <div key={item.label} className="admin-mini-trend-col">
                  <em className="admin-mini-trend-value">{item.value}</em>
                  <i style={{ height: `${heightPct}%` }} />
                  <span>{item.label}</span>
                </div>
                );
              })}
            </div>
          </article>

          <article className="ds-card admin-ops-card admin-ops-card-fill">
            <div className="admin-ops-card-head">
              <PlugZap size={16} />
              <strong>系统连接</strong>
              <em>{apiReady}/{apiTotal} 已就绪</em>
            </div>
            <div className="admin-connection-list">
              {data.apiStatus.map((item) => (
                <div key={item.id} className="admin-connection-row">
                  <span className={`admin-connection-dot ${item.status}`} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.category}</span>
                  </div>
                  <em>
                    {item.status === 'ready' ? '正常' : item.status === 'missing_key' ? '待配置' : '规划中'}
                  </em>
                </div>
              ))}
            </div>
            <div className="admin-ops-kpi-row">
              <div>
                <span>API 就绪率</span>
                <strong>{data.summary.apiReadyRatio}%</strong>
              </div>
              <div>
                <span>回放归档</span>
                <strong>{data.summary.replayCount ?? 0}</strong>
              </div>
            </div>
          </article>

          <article className="ds-card admin-ops-card admin-ops-card-fill">
            <div className="admin-ops-card-head">
              <Users size={16} />
              <strong>近期活跃</strong>
              <em>最近登录或任务跟进</em>
            </div>
            <div className="admin-active-users admin-active-users-compact">
              {recentUsers.map((user) => (
                <div key={user.id} className="admin-active-user-row">
                  <div className="admin-active-user-avatar">{user.name.slice(0, 1)}</div>
                  <div className="admin-active-user-meta">
                    <strong>{user.name}</strong>
                    <span>{user.organization || user.account}</span>
                  </div>
                  <MembershipBadge tier={user.tier} />
                  <em>{formatRelativeTime(user.lastActiveAt)}</em>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default AdminOpsCharts;
