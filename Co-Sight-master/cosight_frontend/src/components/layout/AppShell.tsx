import { useState, type ReactNode } from 'react';
import { ChevronRight, LogOut, Menu, Plus, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../app/BrandLogo';
import MembershipBadge from '../membership/MembershipBadge';
import SidebarUserPanel from './SidebarUserPanel';
import { APP_NAV_GROUPS, ROUTE_LABELS } from '../../config/navigation';
import { getAuthedRole, getCurrentMembershipTier } from '../../lib/storage';

type AppShellProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  onLogout?: () => void;
};

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [{ path: '/', label: '首页' }];
  }

  return segments.reduce<Array<{ path: string; label: string }>>((acc) => {
    const path = `/${segments.slice(0, acc.length + 1).join('/')}`;
    acc.push({ path, label: ROUTE_LABELS[path] || path });
    return acc;
  }, []);
}

function AppShell({ title, subtitle, badge, actions, children, onLogout }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs(location.pathname);
  const role = getAuthedRole();
  const membershipTier = role === 'user' ? getCurrentMembershipTier() : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navGroups = APP_NAV_GROUPS;

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭菜单"
        />
      )}

      <aside className={`app-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="app-sidebar-brand">
          <BrandLogo subtitle="LexHub Workspace" compact />
          <button
            type="button"
            className="app-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭侧边栏"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="app-sidebar-nav">
          <button
            type="button"
            className="app-sidebar-link app-sidebar-link-primary"
            onClick={() => {
              setSidebarOpen(false);
              navigate(role === 'admin' ? '/admin' : '/workspace');
            }}
          >
            <Plus size={16} />
              <span>{role === 'admin' ? '管理控制台' : '发起事项'}</span>
          </button>

          {navGroups.map((group) => (
            <div key={group.label} className="app-sidebar-group">
              <p className="app-sidebar-group-label">{group.label}</p>
              {group.items.map(({ id, label, to, icon: Icon, end }) => (
                <NavLink
                  key={id}
                  to={to}
                  end={end}
                  className={({ isActive }) => `app-sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-foot">
          <SidebarUserPanel />
          {onLogout && (
            <button type="button" className="app-sidebar-link" onClick={onLogout}>
              <LogOut size={16} />
              <span>退出登录</span>
            </button>
          )}
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-topbar-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="打开菜单"
            >
              <Menu size={18} />
            </button>
            <nav className="app-breadcrumbs" aria-label="面包屑">
              {breadcrumbs.map((crumb, idx) => (
                <span key={crumb.path} className="app-breadcrumb-item">
                  {idx > 0 && <ChevronRight size={14} />}
                  {idx === breadcrumbs.length - 1 ? (
                    <strong>{crumb.label}</strong>
                  ) : (
                    <button type="button" onClick={() => navigate(crumb.path)}>
                      {crumb.label}
                    </button>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <div className="app-topbar-title-mobile">
            <strong>{title}</strong>
            {subtitle && <span>{subtitle}</span>}
          </div>
          <div className="app-topbar-actions">
            {role === 'user' && membershipTier && <MembershipBadge tier={membershipTier} />}
            {badge}
            {actions}
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
