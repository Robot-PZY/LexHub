import { Check, Crown, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import MembershipBadge from '../components/membership/MembershipBadge';
import PageHeader from '../components/ui/PageHeader';
import { MEMBERSHIP_PLANS } from '../config/membership';
import {
  clearAuthed,
  getCurrentMembershipTier,
  loadDemoUser,
  setMembershipTierForAccount,
} from '../lib/storage';
import type { MembershipTier } from '../types/membership';

function MembershipPage() {
  const navigate = useNavigate();
  const profile = loadDemoUser();
  const currentTier = getCurrentMembershipTier();
  const [pendingTier, setPendingTier] = useState<MembershipTier | null>(null);
  const [toast, setToast] = useState('');

  const currentPlan = useMemo(
    () => MEMBERSHIP_PLANS.find((plan) => plan.id === currentTier) ?? MEMBERSHIP_PLANS[0],
    [currentTier],
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const handleSelectPlan = (tier: MembershipTier) => {
    if (!profile?.account) {
      navigate('/login');
      return;
    }
    if (tier === currentTier) {
      showToast('您当前已是该套餐，无需重复操作。');
      return;
    }
    setPendingTier(tier);
  };

  const confirmDemoCheckout = () => {
    if (!pendingTier || !profile?.account) return;
    setMembershipTierForAccount(profile.account, pendingTier);
    const plan = MEMBERSHIP_PLANS.find((item) => item.id === pendingTier);
    setPendingTier(null);
    showToast(`套餐已切换至「${plan?.label ?? pendingTier}」（当前体验环境未产生真实扣费）。`);
  };

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="会员中心"
      subtitle={profile?.account ? `当前账号：${profile.account}` : '套餐与续费'}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={Crown}
        title="会员中心"
        subtitle="按事项规模与交付需求选择不同能力组合。"
      />

      {toast && <div className="admin-save-hint membership-toast">{toast}</div>}

      <section className="ds-card membership-current-card">
        <div className="membership-current-copy">
          <p className="eyebrow">当前套餐</p>
          <div className="membership-current-title">
            <strong>{currentPlan.label}</strong>
            <MembershipBadge tier={currentTier} />
          </div>
          <p>{currentPlan.description}</p>
        </div>
        <div className="membership-current-price">
          <span>{currentPlan.priceLabel}</span>
          <em>{currentPlan.periodLabel}</em>
        </div>
      </section>

      <section className="landing-pricing-section membership-pricing-section">
        <div className="landing-section-head">
          <p className="eyebrow">套餐方案</p>
          <h2>按事项规模选择能力组合，支持升级与续费。</h2>
        </div>
        <div className="landing-pricing-grid">
          {MEMBERSHIP_PLANS.map((plan) => {
            const isCurrent = plan.id === currentTier;
            const isUpgrade = MEMBERSHIP_PLANS.findIndex((p) => p.id === plan.id)
              > MEMBERSHIP_PLANS.findIndex((p) => p.id === currentTier);
            return (
              <article
                key={plan.id}
                className={`ds-card landing-pricing-card membership-plan-card ${plan.id === 'pro' ? 'highlighted' : ''} ${isCurrent ? 'is-current' : ''}`}
              >
                <div className="landing-pricing-top">
                  <strong>{plan.label}</strong>
                  {plan.id === 'pro' ? <span className="ds-badge ds-badge-primary">推荐</span> : null}
                  {isCurrent ? <span className="ds-badge">当前</span> : null}
                </div>
                <div className="landing-pricing-price">
                  {plan.priceLabel}
                  <small>{plan.periodLabel}</small>
                </div>
                <p>{plan.description}</p>
                <p className="membership-price-note">{plan.priceNote}</p>
                <ul className="landing-pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`btn ${plan.id === 'pro' && !isCurrent ? 'btn-primary' : 'btn-secondary'} btn-block`}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent}
                >
                  {isCurrent ? '当前套餐' : isUpgrade ? plan.cta : '切换至该套餐'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ds-card membership-demo-note">
        <Sparkles size={16} />
        <p>
          当前版本为本地体验环境：点击升级后会切换会员档位，侧边栏徽章与事项权限展示会同步更新，不涉及真实支付网关。
        </p>
      </section>

      {pendingTier && (
        <div className="membership-modal-backdrop" role="presentation" onClick={() => setPendingTier(null)}>
          <div className="membership-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">套餐确认</p>
            <h3>
              确认{MEMBERSHIP_PLANS.find((p) => p.id === pendingTier)?.label}
              {currentTier === pendingTier ? '续费' : '升级'}
            </h3>
            <p className="membership-modal-desc">
              将切换至「{MEMBERSHIP_PLANS.find((p) => p.id === pendingTier)?.label}」。
              当前体验环境不会发起真实扣费，仅更新本地会员状态。
            </p>
            <div className="membership-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPendingTier(null)}>取消</button>
              <button type="button" className="btn btn-primary" onClick={confirmDemoCheckout}>
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default MembershipPage;
