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
    label: '我的工作',
    items: [
      { id: 'workspace', label: '智能工作台', to: '/workspace', icon: Home, end: true },
      { id: 'workspace-run', label: '任务执行', to: '/workspace/run', icon: GitBranch },
      { id: 'workspace-result', label: '任务结果', to: '/workspace/result', icon: ShieldCheck },
      { id: 'replay', label: '归档与回放', to: '/replay', icon: History },
      { id: 'materials', label: '材料库', to: '/materials', icon: FolderOpen },
    ],
  },
];

export const LEGAL_AGENT_PIPELINE = [
  { id: 'planner', label: '规划', title: '任务理解智能体', icon: GitBranch },
  { id: 'evidence', label: '证据', title: '证据质检智能体', icon: Upload },
  { id: 'research', label: '研究', title: '法规研究智能体', icon: ScrollText },
  { id: 'drafting', label: '生成', title: '文书生成智能体', icon: ScrollText },
  { id: 'review', label: '审查', title: '交叉审查智能体', icon: ShieldCheck },
] as const;

export const ROUTE_LABELS: Record<string, string> = {
  '/': '首页',
  '/workspace': '智能工作台',
  '/workspace/run': '任务执行',
  '/workspace/result': '任务结果',
  '/materials': '材料库',
  '/membership': '会员中心',
  '/replay': '归档与回放',
  '/admin': '管理控制台',
  '/login': '登录',
};
