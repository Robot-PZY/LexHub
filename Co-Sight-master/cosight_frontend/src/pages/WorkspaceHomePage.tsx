import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Plus,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { Badge, EmptyState, Status } from '../components/ui';
import { findScenario } from '../lib/scenarios';
import {
  clearAuthed,
  listMatters,
  loadDemoUser,
  setActiveMatter,
  type MatterRecord,
  type MatterStatus,
} from '../lib/storage';

const statusMeta: Record<MatterStatus, { label: string; status: 'waiting' | 'running' | 'success' | 'danger' | 'archived' }> = {
  draft: { label: '待办理', status: 'waiting' },
  running: { label: '办理中', status: 'running' },
  completed: { label: '已完成', status: 'success' },
  failed: { label: '需关注', status: 'danger' },
  archived: { label: '已归档', status: 'archived' },
};

const quickScenarios = [
  {
    id: 'contract_review',
    title: '合同审查',
    desc: '识别条款风险、核验依据并形成修改建议。',
    icon: ShieldCheck,
    output: '合同审查报告',
  },
  {
    id: 'dispute_resolution',
    title: '争议解决',
    desc: '整理事实时间线、证据缺口与应对路径。',
    icon: Scale,
    output: '争议分析报告',
  },
  {
    id: 'legal_research',
    title: '法规研究',
    desc: '调度检索能力，汇总法规、案例与公开资料。',
    icon: Search,
    output: '法律研究备忘录',
  },
];

function formatTime(value: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function matterTarget(matter: MatterRecord) {
  if (matter.status === 'completed' || matter.status === 'archived') {
    return `/workspace/result?matter=${encodeURIComponent(matter.id)}`;
  }
  return `/workspace/run?matter=${encodeURIComponent(matter.id)}`;
}

function WorkspaceHomePage() {
  const navigate = useNavigate();
  const user = loadDemoUser();
  const matters = listMatters();
  const running = matters.filter((matter) => matter.status === 'running' || matter.status === 'draft').length;
  const completed = matters.filter((matter) => matter.status === 'completed' || matter.status === 'archived').length;
  const materialCount = matters.reduce((total, matter) => total + matter.uploadIds.length, 0);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="工作台总览"
      subtitle="查看事项状态、最近交付并快速开始新的智能办理"
      badge={<Badge tone="success" icon={<Bot size={12} />}>智能体服务在线</Badge>}
      actions={(
        <Link className="lex-button lex-button-primary lex-button-md" to="/workspace/new">
          <Plus size={16} />
          新建事项
        </Link>
      )}
      onLogout={handleLogout}
    >
      <div className="workspace-home-v2">
        <section className="workspace-home-hero">
          <div>
            <p className="eyebrow">LEGAL AGENT WORKSPACE</p>
            <h1>{user?.name ? `${user.name}，欢迎回来。` : '欢迎回到律枢。'}</h1>
            <p>从一个明确目标开始，系统会自动规划办理路径、调度专业智能体并记录每次工具调用。</p>
            <div className="workspace-home-hero-actions">
              <Link className="lex-button lex-button-primary lex-button-lg" to="/workspace/new">
                发起智能办理
                <ArrowRight size={17} />
              </Link>
              <Link className="lex-button lex-button-secondary lex-button-lg" to="/replay">查看历史归档</Link>
            </div>
          </div>
          <div className="workspace-home-path-card" aria-label="智能办理流程">
            <div className="workspace-home-path-head">
              <span><i /> Agent Path</span>
              <strong>动态编排</strong>
            </div>
            <div className="workspace-home-path-flow">
              <span className="done">事项受理</span>
              <span className="active">规划 DAG</span>
              <span>工具调用</span>
              <span>结果交付</span>
            </div>
            <p>阶段节点、调用工具与阶段结果将在执行工作台实时呈现。</p>
          </div>
        </section>

        <section className="workspace-home-stats" aria-label="事项统计">
          <article><Clock3 size={18} /><span>办理中</span><strong>{running}</strong><em>项事项</em></article>
          <article><CheckCircle2 size={18} /><span>已完成</span><strong>{completed}</strong><em>项交付</em></article>
          <article><FolderOpen size={18} /><span>关联材料</span><strong>{materialCount}</strong><em>份文件</em></article>
          <article><FileText size={18} /><span>历史记录</span><strong>{matters.length}</strong><em>条可回放</em></article>
        </section>

        <div className="workspace-home-grid">
          <section className="workspace-home-section workspace-home-matters">
            <div className="workspace-home-section-head">
              <div>
                <span>最近事项</span>
                <h2>继续办理或查看交付</h2>
              </div>
              <Link className="text-button" to="/replay">全部记录</Link>
            </div>

            {matters.length > 0 ? (
              <div className="workspace-home-matter-list">
                {matters.slice(0, 6).map((matter) => {
                  const meta = statusMeta[matter.status];
                  const scenario = matter.scenario ? findScenario(matter.scenario) : undefined;
                  return (
                    <Link
                      key={matter.id}
                      className="workspace-home-matter"
                      to={matterTarget(matter)}
                      onClick={() => setActiveMatter(matter.id)}
                    >
                      <div className="workspace-home-matter-icon"><FileText size={17} /></div>
                      <div className="workspace-home-matter-copy">
                        <strong>{matter.title}</strong>
                        <span>{scenario?.title ?? '通用分析'} · 更新于 {formatTime(matter.updatedAt)}</span>
                      </div>
                      <Status status={meta.status} size="sm">{meta.label}</Status>
                      <ArrowRight size={16} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<FileText size={22} />}
                title="暂无事项记录"
                description="新建一个法律事项，或从右侧示例场景开始体验完整的智能体办理流程。"
                action={(
                  <Link className="lex-button lex-button-primary lex-button-md" to="/workspace/new">
                    新建事项
                    <ArrowRight size={16} />
                  </Link>
                )}
              />
            )}
          </section>

          <aside className="workspace-home-section workspace-home-quick">
            <div className="workspace-home-section-head">
              <div>
                <span>快速开始</span>
                <h2>示例办理场景</h2>
              </div>
            </div>
            <div className="workspace-home-scenario-list">
              {quickScenarios.map(({ id, title, desc, icon: Icon, output }) => (
                <Link key={id} to={`/workspace/new?scenario=${id}`} className="workspace-home-scenario">
                  <div><Icon size={17} /></div>
                  <span>
                    <strong>{title}</strong>
                    <p>{desc}</p>
                    <em>交付：{output}</em>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default WorkspaceHomePage;
