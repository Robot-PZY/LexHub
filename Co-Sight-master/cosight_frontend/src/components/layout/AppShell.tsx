import { useState, type ReactNode } from 'react';
import { ChevronRight, CircleDot, LogOut, Menu, Plus, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../app/BrandLogo';
import MembershipBadge from '../membership/MembershipBadge';
import SidebarUserPanel from './SidebarUserPanel';
import { APP_NAV_GROUPS, MATTER_STAGE_NAV, ROUTE_LABELS } from '../../config/navigation';
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
  const isMatterRoute = location.pathname.startsWith('/workspace/');

  return (
    <div className="app-shell lex-app-shell">
      <a className="lex-skip-link" href="#main-content">跳到主要内容</a>
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
          <BrandLogo subtitle="法律智能工作台" compact />
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
            className="app-sidebar-link app-sidebar-link-primary lex-shell-primary-action"
            onClick={() => {
              setSidebarOpen(false);
              navigate(role === 'admin' ? '/admin' : '/workspace/new');
            }}
          >
            <Plus size={16} />
              <span>{role === 'admin' ? '管理控制台' : '新建法律事项'}</span>
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
          <div className="lex-shell-runtime-state" role="status">
            <CircleDot size={15} />
            <span><strong>智能体服务在线</strong><em>编排与工具链可用</em></span>
          </div>
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

        {isMatterRoute && (
          <nav className="lex-matter-stage-nav" aria-label="事项办理阶段">
            <span className="lex-matter-stage-label">当前事项</span>
            <div className="lex-matter-stage-track">
              {MATTER_STAGE_NAV.map(({ id, label, to, icon: Icon, end }, index) => (
                <NavLink
                  key={id}
                  to={to}
                  end={end}
                  className={({ isActive }) => `lex-matter-stage${isActive ? ' active' : ''}`}
                >
                  <span className="lex-matter-stage-index">{index + 1}</span>
                  <Icon size={15} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}

        <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
