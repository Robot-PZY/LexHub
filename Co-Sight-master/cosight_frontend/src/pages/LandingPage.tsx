import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  Clock3,
  Crown,
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
import { MEMBERSHIP_PLANS } from '../config/membership';
import {
  fetchDemoOverview,
  fetchDemoRuntimeStatus,
} from '../lib/api';
import { isAuthed } from '../lib/storage';
import type { DemoOverview, DemoRuntimeStatus } from '../types/demo';

const topNavItems = [
  { label: '首页', href: '#home' },
  { label: '能力', href: '#capabilities' },
  { label: '办理流程', href: '#workflow' },
  { label: '场景', href: '#scenes' },
  { label: '会员方案', href: '#pricing' },
];

const capabilityItems = [
  { title: '事项受理', desc: '按法律场景快速提交材料与诉求。', icon: Scale },
  { title: '路径研判', desc: '根据材料状态生成办理路径。', icon: Workflow },
  { title: '证据质检', desc: '先发现缺口，再进入结论。', icon: FileSearch },
  { title: '可追溯交付', desc: '保留依据、审查与归档记录。', icon: FolderArchive },
];

const workflowSteps = [
  { step: '01', title: '提交事项', desc: '输入事实、材料与目标产出' },
  { step: '02', title: '研判路径', desc: '根据材料状态生成办理路径' },
  { step: '03', title: '协同办理', desc: '证据、法规、文书、复核按需推进' },
  { step: '04', title: '交付归档', desc: '形成报告、文书与办理记录' },
];

const scenes = [
  { title: '合同审查', desc: '风险条款、履约证据、修改建议', icon: ShieldCheck },
  { title: '公司事务', desc: '股权、章程、决议与治理材料', icon: Building2 },
  { title: '争议解决', desc: '事实时间线、证据清单、策略建议', icon: Scale },
];

const heroPillars = ['路径研判', '证据质检', '法规研究', '结论复核'];

const logicNodes = [
  { label: '输入', meta: '事实 / 材料', tone: 'paper' },
  { label: '判断', meta: '识别缺口', tone: 'gold' },
  { label: '办理', meta: '选择能力', tone: 'blue' },
  { label: '交付', meta: '归档复核', tone: 'dark' },
];

function ProductPreview() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const previewSlides = [
    {
      id: 'matter',
      label: '事项总览',
      title: '合同审查办理',
      description: '先核验材料，再补充依据，交付前统一复核。',
      metrics: [
        ['证据完整度', '82%'],
        ['引用依据', '12'],
        ['复核风险', '3'],
        ['归档记录', 'Ready'],
      ],
      nodes: [
        { hop: 1, label: '事项受理', agent: '事项受理智能体', status: 'completed' },
        { hop: 2, label: '证据质检', agent: '证据质检智能体', status: 'completed' },
        { hop: 3, label: '法规研究', agent: '法规研究智能体', status: 'running' },
        { hop: 4, label: '文书生成', agent: '文书生成智能体', status: 'branch' },
        { hop: 5, label: '交叉审查', agent: '交叉审查智能体', status: 'branch' },
      ],
    },
    {
      id: 'review',
      label: '审查结论',
      title: '风险与依据同步呈现',
      description: '结论、风险、引用来源与下一步建议集中输出。',
      metrics: [
        ['高风险', '1'],
        ['中风险', '2'],
        ['可追溯依据', '18'],
        ['报告状态', 'Done'],
      ],
      nodes: [
        { hop: 1, label: '事实摘要', agent: '事实整理模块', status: 'completed' },
        { hop: 2, label: '风险分层', agent: '风险审查模块', status: 'running' },
        { hop: 3, label: '依据引用', agent: '法规检索模块', status: 'completed' },
        { hop: 4, label: '复核建议', agent: '结论复核模块', status: 'branch' },
      ],
    },
    {
      id: 'delivery',
      label: '文书交付',
      title: '报告与文书按需生成',
      description: '办理记录沉淀为报告、审查意见和归档材料。',
      metrics: [
        ['交付类型', '4'],
        ['生成进度', '96%'],
        ['导出格式', 'DOCX'],
        ['归档状态', 'Saved'],
      ],
      nodes: [
        { hop: 1, label: '报告生成', agent: '报告交付模块', status: 'completed' },
        { hop: 2, label: '审查意见', agent: '文书生成模块', status: 'running' },
        { hop: 3, label: '材料归档', agent: '归档模块', status: 'completed' },
        { hop: 4, label: '再次复核', agent: '交叉审查模块', status: 'branch' },
      ],
    },
  ];

  useEffect(() => {
    if (paused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % previewSlides.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [paused, previewSlides.length]);

  return (
    <div
      className="landing-preview-card landing-preview-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="landing-preview-bar">
        <span className="landing-dot red" />
        <span className="landing-dot amber" />
        <span className="landing-dot green" />
        <span>LexHub · Matter Path</span>
      </div>
      <div className="landing-preview-body">
        <div
          className="landing-preview-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {previewSlides.map((slide) => (
            <div key={slide.id} className="landing-preview-slide">
              <div className="landing-preview-panel primary">
                <div>
                  <span>{slide.label}</span>
                  <strong>{slide.title}</strong>
                </div>
                <p>{slide.description}</p>
              </div>
              <div className="landing-preview-grid">
                {slide.metrics.map(([item, value]) => (
                  <div key={item} className="landing-preview-mini">
                    <span>{item}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="landing-preview-dag">
                {slide.nodes.map((node, index) => (
                  <div key={node.label} className="landing-preview-dag-row">
                    <article className={`landing-preview-dag-node ${node.status}`}>
                      <span className="dag-hop">H{node.hop}</span>
                      <div>
                        <strong>{node.label}</strong>
                        <em>{node.agent}</em>
                      </div>
                    </article>
                    {index < slide.nodes.length - 1 && (
                      <GitBranch size={12} className="landing-preview-dag-connector" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="landing-preview-dots" aria-label="产品预览页">
        {previewSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={activeSlide === index ? 'active' : ''}
            aria-label={`查看${slide.label}`}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const authed = isAuthed();
  const workspacePath = authed ? '/workspace' : '/login';
  const replayPath = authed ? '/replay' : '/login';
  const membershipPath = authed ? '/membership' : '/login';
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
          <a href={replayPath}>案件归档</a>
        </nav>
        <div className="landing-top-actions">
          {!authed && <Link className="btn btn-ghost" to="/login">登录</Link>}
          <Link className="btn btn-primary" to={workspacePath}>
            {authed ? '进入事项受理' : '免费体验'}
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
              <span>可研判，可审查，可归档</span>
            </div>
            <h1 className="landing-hero-title">
              <span className="landing-title-line-primary">让法律事项</span>
              <span className="landing-title-line-middle">进入</span>
              <span className="landing-title-line-accent">智能办理链路</span>
            </h1>
            <p>
              从事实材料到依据检索、风险审查与文书交付，系统按事项状态推进办理，让每一步都有依据、有记录、可复核。
            </p>
            <div className="landing-minimal-actions">
              <Link className="btn btn-primary" to={workspacePath}>
                发起事项
                <ArrowRight size={16} />
              </Link>
              <a className="btn btn-secondary" href="#workflow">查看办理流程</a>
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
          <StatCard label="历史事项" value={overview ? `${overview.stats.replay_count}` : '--'} description="已沉淀归档记录" />
          <StatCard label="专业角色" value="6" description="按事项状态协同办理" />
          <StatCard label="交付链路" value="闭环" description="材料、依据、结论、文书" />
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
            <strong>从受理到交付的智能闭环</strong>
          </div>
          <p className="landing-section-caption">先研判，再办理；先审查，再交付。</p>
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
            <strong>最近办理</strong>
          </div>
            <p>{runtimeStatus?.summary ?? '系统已准备好接收新的法律事项。'}</p>
            <Link className="text-button" to={replayPath}>查看案件归档</Link>
          </div>
        </section>

        <section className="landing-logic-art" id="architecture" aria-label="处理逻辑视觉图">
          <div className="landing-section-head">
            <p className="eyebrow">办理逻辑</p>
            <h2>事实进入系统，路径自动成形。</h2>
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

        <section className="landing-pricing-section" id="pricing">
          <div className="landing-section-head">
            <p className="eyebrow">会员方案</p>
            <h2>按事项规模选择合适的办理能力。</h2>
          </div>
          <div className="landing-pricing-grid">
            {MEMBERSHIP_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`ds-card landing-pricing-card ${plan.id === 'pro' ? 'highlighted' : ''}`}
              >
                <div className="landing-pricing-top">
                  <strong>{plan.label}</strong>
                  {plan.id === 'pro' ? <span className="ds-badge ds-badge-primary">推荐</span> : null}
                </div>
                <div className="landing-pricing-price">
                  {plan.priceLabel}
                  <small>{plan.periodLabel}</small>
                </div>
                <p>{plan.description}</p>
                <p className="membership-price-note">{plan.priceNote}</p>
                <ul className="landing-pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={14} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link className="btn btn-secondary btn-block" to={membershipPath}>
                  <Crown size={16} />
                  查看方案
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta-band">
          <div className="landing-cta-copy">
            <div className="landing-cta-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h2>开始一次智能办理。</h2>
          </div>
          <div className="landing-cta-actions">
            <Link className="btn btn-primary" to={workspacePath}>
              <span>进入事项受理</span>
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
