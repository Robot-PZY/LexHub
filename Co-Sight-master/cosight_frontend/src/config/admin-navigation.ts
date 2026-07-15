import {
  BookOpen,
  BarChart3,
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
    label: '系统运行',
    items: [
      { id: 'overview', label: '系统概览', to: '/admin', icon: LayoutDashboard, end: true },
      { id: 'analytics', label: '数据分析', to: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: '能力配置',
    items: [
      { id: 'connections', label: '模型与 API', to: '/admin/connections', icon: PlugZap },
      { id: 'knowledge', label: '知识资产', to: '/admin/knowledge', icon: BookOpen },
      { id: 'policies', label: '编排策略', to: '/admin/policies', icon: GitBranch },
    ],
  },
  {
    label: '用户与审计',
    items: [
      { id: 'users', label: '用户管理', to: '/admin/users', icon: Users },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export const ADMIN_ROUTE_LABELS: Record<string, string> = {
  '/admin': '系统概览',
  '/admin/connections': '模型与 API',
  '/admin/knowledge': '知识库',
  '/admin/policies': '策略规则',
  '/admin/users': '用户管理',
  '/admin/models': '模型配置',
  '/admin/apis': '外部服务',
  '/admin/routing': '策略规则',
  '/admin/review-rules': '策略规则',
  '/admin/analytics': '数据分析',
};
