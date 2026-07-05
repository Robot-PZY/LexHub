import { ChevronUp, Crown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthedRole, getCurrentMembershipTier, loadAdminSession, loadDemoUser } from '../../lib/storage';
import { getMembershipTierMeta } from '../../config/membership';
import MembershipBadge from '../membership/MembershipBadge';

function SidebarUserPanel() {
  const navigate = useNavigate();
  const role = getAuthedRole();
  const profile = loadDemoUser();
  const displayName = profile?.account?.trim()
    || profile?.name?.trim()
    || (role === 'admin' ? '管理员' : '未登录');
  const tier = getCurrentMembershipTier();
  const tierMeta = getMembershipTierMeta(tier);
  const initial = displayName.slice(0, 1).toUpperCase();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (role === 'admin') {
    const session = loadAdminSession();
    const displayName = session?.displayName ?? '系统管理员';
    const accountLabel = session?.account ?? 'Admin';
    const initial = '管';
    return (
      <div className="app-sidebar-user-card">
        <div className="app-sidebar-user-avatar admin-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="app-sidebar-user-meta">
          <strong title={accountLabel}>{displayName}</strong>
          <span className="membership-badge membership-badge-primary">管理端</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-sidebar-user-wrap" ref={panelRef}>
      <button
        type="button"
        className="app-sidebar-user-card app-sidebar-user-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="app-sidebar-user-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="app-sidebar-user-meta">
          <strong title={profile?.account}>{displayName}</strong>
          <MembershipBadge tier={tier} />
        </div>
        <ChevronUp size={14} className={`app-sidebar-user-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="app-sidebar-user-menu" role="menu">
          <div className="app-sidebar-user-menu-head">
            <span>{displayName}</span>
            <em>{tierMeta.label}</em>
          </div>
          <button
            type="button"
            role="menuitem"
            className="app-sidebar-user-menu-item"
            onClick={() => {
              setOpen(false);
              navigate('/membership');
            }}
          >
            <Crown size={15} />
            <span>升级 / 续费套餐</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default SidebarUserPanel;
