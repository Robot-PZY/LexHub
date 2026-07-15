import {
  FolderOpen,
  GitBranch,
  History,
  Home,
  PlusCircle,
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
    label: '用户工作台',
    items: [
      { id: 'workspace-home', label: '工作台总览', to: '/workspace', icon: Home, end: true },
      { id: 'workspace-new', label: '新建事项', to: '/workspace/new', icon: PlusCircle },
      { id: 'materials', label: '材料库', to: '/materials', icon: FolderOpen },
      { id: 'replay', label: '历史归档', to: '/replay', icon: History },
    ],
  },
];

export const MATTER_STAGE_NAV: NavItem[] = [
  { id: 'matter-intake', label: '事项受理', to: '/workspace/new', icon: Home, end: true },
  { id: 'matter-run', label: '智能体执行', to: '/workspace/run', icon: GitBranch },
  { id: 'matter-result', label: '结果交付', to: '/workspace/result', icon: ShieldCheck },
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
  '/workspace': '工作台总览',
  '/workspace/new': '新建事项',
  '/workspace/run': '智能体执行',
  '/workspace/result': '结果交付',
  '/materials': '材料库',
  '/membership': '会员中心',
  '/replay': '历史归档',
  '/admin': '管理控制台',
  '/login': '登录',
};
