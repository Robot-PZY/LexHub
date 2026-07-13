import {
  FolderOpen,
  GitBranch,
  History,
  Home,
  ScrollText,
  ShieldCheck,
  Upload,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  to: string;
  icon: typeof Home;
  end?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    label: '事项办理',
    items: [
      { id: 'workspace', label: '发起事项', to: '/workspace', icon: Home, end: true },
      { id: 'workspace-run', label: '办理运行', to: '/workspace/run', icon: GitBranch },
      { id: 'workspace-result', label: '结论与交付', to: '/workspace/result', icon: ShieldCheck },
      { id: 'materials', label: '材料库', to: '/materials', icon: FolderOpen },
      { id: 'replay', label: '历史回放', to: '/replay', icon: History },
    ],
  },
];

export const LEGAL_AGENT_PIPELINE = [
  { id: 'planner', label: '受理', title: '事项受理智能体', icon: GitBranch },
  { id: 'evidence', label: '证据', title: '证据质检智能体', icon: Upload },
  { id: 'research', label: '研究', title: '法规研究智能体', icon: ScrollText },
  { id: 'drafting', label: '文书', title: '文书生成智能体', icon: ScrollText },
  { id: 'review', label: '复核', title: '结论复核智能体', icon: ShieldCheck },
] as const;

export const ROUTE_LABELS: Record<string, string> = {
  '/': '首页',
  '/workspace': '发起事项',
  '/workspace/run': '办理运行',
  '/workspace/result': '结论与交付',
  '/materials': '材料库',
  '/membership': '会员中心',
  '/replay': '历史回放',
  '/admin': '管理控制台',
  '/login': '登录',
};
