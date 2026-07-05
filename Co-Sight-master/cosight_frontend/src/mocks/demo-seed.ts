import type { MembershipUser } from '../types/membership';
import type { AnalyticsOverview } from '../types/analytics';
import { mockPerformanceBenchmark } from './workflow';

/** Bump when curated demo data changes — triggers optional reseed. */
export const DEMO_SEED_VERSION = 7;

export function demoTimestamp(daysAgo = 0, hoursAgo = 0): number {
  return Date.now() - daysAgo * 86_400_000 - hoursAgo * 3_600_000;
}

/** 按自然日对齐的注册时间（0 = 今天，6 = 6 天前） */
export function demoRegisteredDay(daysBeforeToday: number, hour = 10): number {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysBeforeToday,
    hour,
    0,
    0,
    0,
  ).getTime();
}

/** 近 7 日每日新增演示分布（6 天前 → 今天，合计 27） */
const WEEKLY_REGISTRATION_DIST = [4, 3, 5, 4, 4, 3, 4];

function applyWeeklyRegistrationDates(users: MembershipUser[]): MembershipUser[] {
  const next = [...users];
  let cursor = 0;
  WEEKLY_REGISTRATION_DIST.forEach((count, dayIndex) => {
    const daysBeforeToday = 6 - dayIndex;
    for (let slot = 0; slot < count && cursor < next.length; slot += 1) {
      next[cursor] = {
        ...next[cursor],
        createdAt: demoRegisteredDay(daysBeforeToday, 9 + slot * 2),
      };
      cursor += 1;
    }
  });
  return next;
}

export const DEMO_USER_ACCOUNT = 'user';
export const DEMO_USER_PASSWORD = 'user123456';
export const DEMO_USER_DISPLAY_NAME = '演示开发者';

export const ADMIN_DISPLAY_NAME = '系统管理员';

const RAW_MEMBERSHIP_USERS: MembershipUser[] = [
  {
    id: 'demo-user-dev',
    name: DEMO_USER_DISPLAY_NAME,
    account: DEMO_USER_ACCOUNT,
    organization: '律枢开发演示账号',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(45),
    lastActiveAt: demoTimestamp(0, 2),
  },
  {
    id: 'demo-zhangwei',
    name: '张伟',
    account: 'zhangwei',
    organization: '锦天城律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(28),
    lastActiveAt: demoTimestamp(1, 3),
  },
  {
    id: 'demo-lixin',
    name: '李欣',
    account: 'lixin',
    organization: '某科技公司法务部',
    tier: 'trial',
    status: 'trial',
    createdAt: demoTimestamp(14),
    lastActiveAt: demoTimestamp(2, 5),
  },
  {
    id: 'demo-wangfang',
    name: '王芳',
    account: 'wangfang',
    organization: '德恒律师事务所',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(60),
    lastActiveAt: demoTimestamp(0, 6),
  },
  {
    id: 'demo-chenhao',
    name: '陈浩',
    account: 'chenhao',
    organization: '个人律师（上海）',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(21),
    lastActiveAt: demoTimestamp(3, 1),
  },
  {
    id: 'demo-liuyang',
    name: '刘洋',
    account: 'liuyang',
    organization: '金杜律师事务所',
    tier: 'trial',
    status: 'inactive',
    createdAt: demoTimestamp(90),
    lastActiveAt: demoTimestamp(12, 4),
  },
  {
    id: 'demo-zhaomin',
    name: '赵敏',
    account: 'zhaomin',
    organization: '方达律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(35),
    lastActiveAt: demoTimestamp(1, 8),
  },
  {
    id: 'demo-sunlei',
    name: '孙磊',
    account: 'sunlei',
    organization: '某初创企业',
    tier: 'trial',
    status: 'trial',
    createdAt: demoTimestamp(7),
    lastActiveAt: demoTimestamp(4, 2),
  },
  {
    id: 'demo-zhoujie',
    name: '周洁',
    account: 'zhoujie',
    organization: '中伦律师事务所',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(52),
    lastActiveAt: demoTimestamp(0, 4),
  },
  {
    id: 'demo-wujing',
    name: '吴静',
    account: 'wujing',
    organization: '华为技术法务部',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(18),
    lastActiveAt: demoTimestamp(1, 1),
  },
  {
    id: 'demo-huangtao',
    name: '黄涛',
    account: 'huangtao',
    organization: '君合律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(25),
    lastActiveAt: demoTimestamp(2, 3),
  },
  {
    id: 'demo-linqian',
    name: '林倩',
    account: 'linqian',
    organization: '腾讯法务中心',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(40),
    lastActiveAt: demoTimestamp(0, 8),
  },
  {
    id: 'demo-xuhao',
    name: '徐浩',
    account: 'xuhao',
    organization: '个人律师（北京）',
    tier: 'trial',
    status: 'trial',
    createdAt: demoTimestamp(5),
    lastActiveAt: demoTimestamp(1, 6),
  },
  {
    id: 'demo-yangmei',
    name: '杨梅',
    account: 'yangmei',
    organization: '环球律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(32),
    lastActiveAt: demoTimestamp(3, 2),
  },
  {
    id: 'demo-guowei',
    name: '郭伟',
    account: 'guowei',
    organization: '字节跳动法务部',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(48),
    lastActiveAt: demoTimestamp(1, 4),
  },
  {
    id: 'demo-helen',
    name: '何蕾',
    account: 'helei',
    organization: '竞天公诚律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(16),
    lastActiveAt: demoTimestamp(4, 5),
  },
  {
    id: 'demo-majun',
    name: '马骏',
    account: 'majun',
    organization: '某制造业法务',
    tier: 'trial',
    status: 'trial',
    createdAt: demoTimestamp(3),
    lastActiveAt: demoTimestamp(0, 10),
  },
  {
    id: 'demo-songyan',
    name: '宋妍',
    account: 'songyan',
    organization: '汉坤律师事务所',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(55),
    lastActiveAt: demoTimestamp(2, 1),
  },
  {
    id: 'demo-dinghao',
    name: '丁浩',
    account: 'dinghao',
    organization: '阿里巴巴法务部',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(22),
    lastActiveAt: demoTimestamp(5, 3),
  },
  {
    id: 'demo-caoqin',
    name: '曹琴',
    account: 'caoqin',
    organization: '世辉律师事务所',
    tier: 'trial',
    status: 'inactive',
    createdAt: demoTimestamp(80),
    lastActiveAt: demoTimestamp(20, 2),
  },
  {
    id: 'demo-luoyan',
    name: '罗岩',
    account: 'luoyan',
    organization: '通商律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(12),
    lastActiveAt: demoTimestamp(1, 2),
  },
  {
    id: 'demo-jiangxin',
    name: '蒋欣',
    account: 'jiangxin',
    organization: '某医疗集团法务',
    tier: 'trial',
    status: 'trial',
    createdAt: demoTimestamp(9),
    lastActiveAt: demoTimestamp(3, 4),
  },
  {
    id: 'demo-panbo',
    name: '潘博',
    account: 'panbo',
    organization: '大成律师事务所',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(38),
    lastActiveAt: demoTimestamp(0, 1),
  },
  {
    id: 'demo-xieyun',
    name: '谢芸',
    account: 'xieyun',
    organization: '美团法务部',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(19),
    lastActiveAt: demoTimestamp(2, 6),
  },
  {
    id: 'demo-fenggang',
    name: '冯刚',
    account: 'fenggang',
    organization: '国浩律师事务所',
    tier: 'trial',
    status: 'trial',
    createdAt: demoTimestamp(6),
    lastActiveAt: demoTimestamp(6, 1),
  },
  {
    id: 'demo-zhumin',
    name: '朱敏',
    account: 'zhumin',
    organization: '海问律师事务所',
    tier: 'pro',
    status: 'active',
    createdAt: demoTimestamp(27),
    lastActiveAt: demoTimestamp(1, 5),
  },
  {
    id: 'demo-hanlei',
    name: '韩磊',
    account: 'hanlei',
    organization: '某基金公司法务',
    tier: 'ultra',
    status: 'active',
    createdAt: demoTimestamp(42),
    lastActiveAt: demoTimestamp(4, 1),
  },
];

export const CURATED_MEMBERSHIP_USERS: MembershipUser[] = applyWeeklyRegistrationDates(RAW_MEMBERSHIP_USERS);

export const CURATED_WEEKLY_REGISTRATION_TOTAL = WEEKLY_REGISTRATION_DIST.reduce((sum, n) => sum + n, 0);

export const CURATED_ANALYTICS_OVERVIEW: AnalyticsOverview = {
  summary: {
    totalCases: 0,
    highRiskRatio: 0,
    agentCalls: 0,
    apiReadyRatio: 83,
    dataSource: 'baseline',
    replayCount: 0,
  },
  caseStages: [],
  riskDistribution: [],
  completenessTrend: [],
  agentCalls: [],
  apiStatus: [
    { id: 'legal_search', name: '得理法律检索', category: '法律研究', status: 'ready', envKeys: ['DELI_API_KEY'], purpose: '法规案例检索' },
    { id: 'ocr', name: 'OCR / 文档解析', category: '材料处理', status: 'ready', envKeys: ['OCR_API_KEY'], purpose: '扫描件识别' },
    { id: 'vector_rag', name: '本地知识库', category: '知识增强', status: 'ready', envKeys: ['CHROMA_PATH'], purpose: 'RAG 检索' },
    { id: 'web_search', name: '联网搜索', category: '公开资料', status: 'missing_key', envKeys: ['SEARCH_API_KEY'], purpose: '补充公开资料' },
    { id: 'export', name: '文书导出', category: '结果交付', status: 'planned', envKeys: [], purpose: 'PDF/DOCX 导出' },
  ],
  performanceBenchmark: mockPerformanceBenchmark,
};
