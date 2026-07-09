import { useEffect, useState, type ReactNode } from 'react';
import { ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../app/BrandLogo';
import SidebarUserPanel from './SidebarUserPanel';
import { ADMIN_NAV_GROUPS, ADMIN_ROUTE_LABELS } from '../../config/admin-navigation';
import { clearAuthed, getAuthedRole, loadAdminSession, loginAdmin, mergeCuratedMembershipUsers } from '../../lib/storage';

type AdminShellProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

function useAdminBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return [{ path: '/admin', label: '系统概览' }];
  }

  return segments.reduce<Array<{ path: string; label: string }>>((acc, segment, index) => {
    const path = `/${segments.slice(0, index).concat(segment).join('/')}`;
    acc.push({ path, label: ADMIN_ROUTE_LABELS[path] || path });
    return acc;
  }, []);
}

export function AdminShell({ title, subtitle, badge, actions, children }: AdminShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = useAdminBreadcrumbs(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (getAuthedRole() === 'admin' && !loadAdminSession()) {
      loginAdmin();
    }
    mergeCuratedMembershipUsers();
  }, []);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button type="button" className="app-sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="关闭菜单" />
      )}

      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-sidebar-brand">
          <BrandLogo subtitle="Admin Console" compact />
          <button type="button" className="app-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="关闭侧边栏">
            <X size={18} />
          </button>
        </div>

        <div className="admin-sidebar-tag">LexHub Admin</div>

        <nav className="admin-sidebar-nav">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-sidebar-group">
              <span className="admin-sidebar-group-label">{group.label}</span>
              {group.items.map(({ id, label, to, icon: Icon, end }) => (
                <NavLink
                  key={id}
                  to={to}
                  end={end}
                  className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <SidebarUserPanel />
          <button type="button" className="admin-sidebar-link" onClick={handleLogout}>
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="app-topbar-left">
            <button type="button" className="app-topbar-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="打开菜单">
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
            {badge}
            {actions}
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

function AdminLayout() {
  return <Outlet />;
}

export default AdminLayout;
