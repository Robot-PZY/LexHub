import {
  BookOpen,
  GitBranch,
  LayoutDashboard,
  PlugZap,
  Users,
} from 'lucide-react';

export type AdminNavItem = {
  id: string;
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: '总览',
    items: [
      { id: 'overview', label: '系统概览', to: '/admin', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: '配置中心',
    items: [
      { id: 'connections', label: '能力总览', to: '/admin/connections', icon: PlugZap },
      { id: 'knowledge', label: '知识库', to: '/admin/knowledge', icon: BookOpen },
      { id: 'policies', label: '策略规则', to: '/admin/policies', icon: GitBranch },
    ],
  },
  {
    label: '运营',
    items: [
      { id: 'users', label: '用户管理', to: '/admin/users', icon: Users },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export const ADMIN_ROUTE_LABELS: Record<string, string> = {
  '/admin': '系统概览',
  '/admin/connections': '能力总览',
  '/admin/knowledge': '知识库',
  '/admin/policies': '策略规则',
  '/admin/users': '用户管理',
  '/admin/models': '能力总览',
  '/admin/apis': '能力总览',
  '/admin/routing': '策略规则',
  '/admin/review-rules': '策略规则',
  '/admin/analytics': '系统概览',
  '/admin/agents': '系统概览',
};
