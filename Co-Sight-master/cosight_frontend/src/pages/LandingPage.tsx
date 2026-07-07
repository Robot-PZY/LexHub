import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Clock3,
  FileSearch,
  FolderArchive,
  GitBranch,
  Scale,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/app/BrandLogo';
import MarketingFooter from '../components/layout/MarketingFooter';
import StatCard from '../components/ui/StatCard';
import {
  fetchDemoOverview,
  fetchDemoRuntimeStatus,
} from '../lib/api';
import { isAuthed } from '../lib/storage';
import type { DemoOverview, DemoRuntimeStatus } from '../types/demo';

const topNavItems = [
  { label: '首页', href: '#home' },
  { label: '能力', href: '#capabilities' },
  { label: '工作流', href: '#workflow' },
  { label: '场景', href: '#scenes' },
];

const capabilityItems = [
  { title: '任务入口', desc: '从场景直接发起处理。', icon: Scale },
  { title: '智能调度', desc: '按状态选择智能体。', icon: Workflow },
  { title: '证据质检', desc: '先发现缺口，再进入结论。', icon: FileSearch },
  { title: '可追溯交付', desc: '保留依据、审查与回放。', icon: FolderArchive },
];

const workflowSteps = [
  { step: '01', title: '描述任务', desc: '输入事实、材料与目标产出' },
  { step: '02', title: '判断路径', desc: '根据任务状态生成可执行 DAG' },
  { step: '03', title: '协同处理', desc: '证据、研究、生成、审查按需触发' },
  { step: '04', title: '交付回放', desc: '形成报告、文书与过程记录' },
];

const scenes = [
  { title: '合同审查', desc: '风险条款、履约证据、修改建议', icon: ShieldCheck },
  { title: '公司事务', desc: '股权、章程、决议与治理材料', icon: Building2 },
  { title: '争议解决', desc: '事实时间线、证据清单、策略建议', icon: Scale },
];

const heroPillars = ['动态调度', '证据质检', '法规研究', '交叉审查'];

const logicNodes = [
  { label: '输入', meta: '事实 / 材料', tone: 'paper' },
  { label: '判断', meta: '识别缺口', tone: 'gold' },
  { label: '调度', meta: '选择能力', tone: 'blue' },
  { label: '交付', meta: '归档复核', tone: 'dark' },
];

function ProductPreview() {
  const previewNodes = [
    { hop: 1, label: '任务理解', agent: '任务理解智能体', status: 'completed' },
    { hop: 2, label: '证据质检', agent: '证据质检智能体', status: 'completed' },
    { hop: 3, label: '法规研究', agent: '法规研究智能体', status: 'running' },
    { hop: 4, label: '文书生成', agent: '文书生成智能体', status: 'branch' },
    { hop: 5, label: '交叉审查', agent: '交叉审查智能体', status: 'branch' },
  ];

  return (
    <div className="landing-preview-card">
      <div className="landing-preview-bar">
        <span className="landing-dot red" />
        <span className="landing-dot amber" />
        <span className="landing-dot green" />
        <span>LexHub · Live Task Graph</span>
      </div>
      <div className="landing-preview-body">
        <div className="landing-preview-panel primary">
          <div>
            <span>Active DAG</span>
            <strong>合同审查任务</strong>
          </div>
          <p>证据不足先质检，引用缺失再研究，导出前统一复核。</p>
        </div>
        <div className="landing-preview-grid">
          {['证据完整度', '引用依据', '复核风险', '归档记录'].map((item, index) => (
            <div key={item} className="landing-preview-mini">
              <span>{item}</span>
              <strong>{index === 0 ? '82%' : index === 1 ? '12' : index === 2 ? '3' : 'Ready'}</strong>
            </div>
          ))}
        </div>
        <div className="landing-preview-dag">
          {previewNodes.map((node, index) => (
            <div key={node.label} className="landing-preview-dag-row">
              <article className={`landing-preview-dag-node ${node.status}`}>
                <span className="dag-hop">H{node.hop}</span>
                <div>
                  <strong>{node.label}</strong>
                  <em>{node.agent}</em>
                </div>
              </article>
              {index < previewNodes.length - 1 && (
                <GitBranch size={12} className="landing-preview-dag-connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const authed = isAuthed();
  const workspacePath = authed ? '/workspace' : '/login';
  const replayPath = authed ? '/replay' : '/login';
  const [overview, setOverview] = useState<DemoOverview | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<DemoRuntimeStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const [overviewData, runtimeData] = await Promise.all([
          fetchDemoOverview().catch(() => null),
          fetchDemoRuntimeStatus().catch(() => null),
        ]);
        if (!cancelled) {
          setOverview(overviewData);
          setRuntimeStatus(runtimeData);
        }
      } catch {
        if (!cancelled) {
          setOverview(null);
          setRuntimeStatus(null);
        }
      }
    }

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, []);

  const isReady = runtimeStatus?.status === 'ready';

  return (
    <div className="landing-hub-shell">
      <header className="landing-top-bar ds-animate-in">
        <BrandLogo subtitle="Legal Intelligence" />
        <nav className="landing-top-nav" aria-label="首页导航">
          {topNavItems.map(({ label, href }) => (
            <a key={label} href={href}>{label}</a>
          ))}
          <a href={replayPath}>记录回放</a>
        </nav>
        <div className="landing-top-actions">
          {!authed && <Link className="btn btn-ghost" to="/login">登录</Link>}
          <Link className="btn btn-primary" to={workspacePath}>
            {authed ? '进入工作台' : '免费体验'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="landing-hub-main">
        <section className="landing-hero-showcase ds-animate-in" id="home">
          <div className="landing-hero-copy-block">
            <div className="landing-hero-brand-lockup">
              <BrandLogo markOnly compact />
              <div>
                <strong>律枢 LexHub</strong>
                <span>Legal Intelligence Workbench</span>
              </div>
            </div>
            <div className="landing-kicker">
              <Sparkles size={14} />
              <span>可调度，可审查，可回放</span>
            </div>
            <h1>
              让法律任务进入
              <span>智能工作流</span>
            </h1>
            <p>
              从任务描述到证据、研究、审查与交付，系统按实际状态调度智能体，而不是机械地走完一条流水线。
            </p>
            <div className="landing-minimal-actions">
              <Link className="btn btn-primary" to={workspacePath}>
                发起任务
                <ArrowRight size={16} />
              </Link>
              <a className="btn btn-secondary" href="#workflow">查看工作流</a>
            </div>
            <div className="landing-hero-tags">
              {heroPillars.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
          <ProductPreview />
        </section>

        <section className="landing-metrics-strip">
          <StatCard label="运行状态" value={isReady ? 'Ready' : 'Standby'} description={runtimeStatus?.summary ?? '系统状态'} />
          <StatCard label="历史任务" value={overview ? `${overview.stats.replay_count}` : '--'} description="已沉淀回放记录" />
          <StatCard label="智能体" value="6" description="按状态动态调度" />
          <StatCard label="核心框架" value="Co-Sight" description="DAG + Agents + Tools" />
        </section>

        <section className="landing-quick-grid" id="capabilities">
          {capabilityItems.map(({ title, desc, icon: Icon }) => (
            <article key={title} className="landing-quick-card">
              <Icon size={18} />
              <div>
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="landing-workflow-card" id="workflow">
          <div className="landing-section-title">
            <BookOpenCheck size={18} />
            <strong>从任务到交付的智能闭环</strong>
          </div>
          <p className="landing-section-caption">先判断，再执行；先审查，再交付。</p>
          <div className="landing-workflow-line">
            {workflowSteps.map(({ step, title, desc }) => (
              <div key={step} className="landing-workflow-step">
                <span>{step}</span>
                <strong>{title}</strong>
                <em>{desc}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-bottom-grid" id="scenes">
          <div className="landing-scenes-card">
            <div className="landing-section-title">
              <Scale size={18} />
              <strong>应用场景</strong>
            </div>
            <div className="landing-scene-list">
              {scenes.map(({ title, desc, icon: Icon }) => (
                <Link key={title} to={workspacePath}>
                  <Icon size={16} />
                  <span>
                    <strong>{title}</strong>
                    <em>{desc}</em>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="landing-status-card">
            <div className="landing-section-title">
              <Clock3 size={18} />
              <strong>最近处理</strong>
            </div>
            <p>{runtimeStatus?.summary ?? '系统已准备好接收新的法律任务。'}</p>
            <Link className="text-button" to={replayPath}>查看记录中心</Link>
          </div>
        </section>

        <section className="landing-logic-art" id="architecture" aria-label="处理逻辑视觉图">
          <div className="landing-section-head">
            <p className="eyebrow">处理逻辑</p>
            <h2>状态进入系统，路径自动成形。</h2>
          </div>
          <div className="landing-logic-canvas">
            <div className="landing-logic-track" aria-hidden="true" />
            {logicNodes.map((node, index) => (
              <article key={node.label} className={`landing-logic-node ${node.tone}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{node.label}</strong>
                <em>{node.meta}</em>
              </article>
            ))}
            <div className="landing-logic-branch-card">
              <span>分支</span>
              <strong>补证 / 研究 / 审查</strong>
            </div>
          </div>
        </section>

        <section className="landing-cta-band">
          <div className="landing-cta-copy">
            <div className="landing-cta-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h2>开始一次智能处理。</h2>
          </div>
          <div className="landing-cta-actions">
            <Link className="btn btn-primary" to={workspacePath}>
              <span>进入工作台</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <MarketingFooter />
      </main>
    </div>
  );
}

export default LandingPage;
