import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  Clock3,
  Crown,
  FileSearch,
  FolderArchive,
  Scale,
  ShieldCheck,
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
  { label: '产品', href: '#home' },
  { label: '产品能力', href: '#capabilities' },
  { label: '办理流程', href: '#workflow' },
  { label: '解决方案', href: '#scenes' },
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
      syncTitle: '合同审查 · 已同步',
      syncMeta: '证据完整度',
      syncValue: '82%',
      title: '服务合同审查',
      description: '先核验材料，再补充依据，交付前统一复核。',
      metrics: [
        { label: '证据完整度', value: '82%', tone: 'success' },
        { label: '引用依据', value: '12', tone: 'primary' },
        { label: '复核风险', value: '3', tone: 'warning' },
        { label: '归档状态', value: 'Ready', tone: 'success' },
      ],
      nodes: [
        { label: '事项受理', caption: '事实与材料', state: 'done' },
        { label: '证据质检', caption: '完整度核验', state: 'done' },
        { label: '法规研究', caption: '依据检索中', state: 'active' },
        { label: '文书生成', caption: '待交付', state: 'pending' },
      ],
      alert: { title: '违约责任条款需复核', caption: 'Review Suggested', tone: 'warning' },
    },
    {
      id: 'review',
      label: '审查结论',
      syncTitle: '审查报告 · 已生成',
      syncMeta: '可追溯依据',
      syncValue: '18',
      title: '风险与依据同步呈现',
      description: '结论、风险、引用来源与下一步建议集中输出。',
      metrics: [
        { label: '高风险', value: '1', tone: 'warning' },
        { label: '中风险', value: '2', tone: 'warning' },
        { label: '可追溯依据', value: '18', tone: 'primary' },
        { label: '报告状态', value: 'Done', tone: 'success' },
      ],
      nodes: [
        { label: '事实摘要', caption: '争议焦点', state: 'done' },
        { label: '风险分层', caption: '条款识别', state: 'active' },
        { label: '依据引用', caption: '法条来源', state: 'done' },
        { label: '复核建议', caption: '律师复核', state: 'pending' },
      ],
      alert: { title: '管辖条款存在不确定性', caption: 'Evidence Required', tone: 'warning' },
    },
    {
      id: 'delivery',
      label: '文书交付',
      syncTitle: '文书交付 · 已保存',
      syncMeta: '生成进度',
      syncValue: '96%',
      title: '报告与文书按需生成',
      description: '办理记录沉淀为报告、审查意见和归档材料。',
      metrics: [
        { label: '交付类型', value: '4', tone: 'primary' },
        { label: '生成进度', value: '96%', tone: 'success' },
        { label: '导出格式', value: 'DOCX', tone: 'primary' },
        { label: '归档状态', value: 'Saved', tone: 'success' },
      ],
      nodes: [
        { label: '报告生成', caption: '审查结论', state: 'done' },
        { label: '审查意见', caption: '文书草稿', state: 'active' },
        { label: '材料归档', caption: '记录沉淀', state: 'done' },
        { label: '再次复核', caption: '交叉检查', state: 'pending' },
      ],
      alert: { title: '审查意见书已生成', caption: 'Ready to Export', tone: 'success' },
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
      className="landing-preview-card landing-brand-mockup"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="landing-preview-bar">
        <span className="landing-dot red" />
        <span className="landing-dot amber" />
        <span className="landing-dot green" />
        <span>LexHub · Matter Path</span>
      </div>
      <div className="landing-preview-body landing-brand-stage">
        <div
          className="landing-preview-track landing-brand-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {previewSlides.map((slide) => (
            <div key={slide.id} className="landing-preview-slide landing-brand-slide">
              <div className="landing-brand-sync-card">
                <Check size={16} />
                <div>
                  <strong>{slide.syncTitle}</strong>
                  <span>{slide.syncMeta}</span>
                </div>
                <em>{slide.syncValue}</em>
              </div>

              <article className="landing-brand-main-card">
                <div className="landing-brand-card-head">
                  <BrandLogo markOnly compact />
                  <span>LexHub Matter Path</span>
                </div>
                <div className="landing-brand-card-copy">
                  <span>{slide.label}</span>
                  <strong>{slide.title}</strong>
                  <p>{slide.description}</p>
                </div>
                <div className="landing-brand-metrics">
                  {slide.metrics.map((item) => (
                    <div key={item.label} className={`landing-brand-metric ${item.tone}`}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <div className="landing-brand-path" aria-label={`${slide.label}办理路径`}>
                {slide.nodes.map((node, index) => (
                  <div key={node.label} className={`landing-brand-node ${node.state}`}>
                    <span>H{index + 1}</span>
                    <div>
                      <strong>{node.label}</strong>
                      <em>{node.caption}</em>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`landing-brand-alert ${slide.alert.tone}`}>
                <ShieldCheck size={15} />
                <div>
                  <strong>{slide.alert.title}</strong>
                  <span>{slide.alert.caption}</span>
                </div>
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
          <a href={replayPath}>历史回放</a>
        </nav>
        <div className="landing-top-actions">
          {!authed && <Link className="btn btn-ghost" to="/login">登录</Link>}
          <Link className="btn btn-primary neo-glow-button" to={workspacePath}>
            {authed ? '进入事项受理' : '发起事项'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="landing-hub-main">
        <section className="landing-hero-showcase neo-title-card ds-animate-in" id="home">
          <div className="landing-hero-copy-block">
            <div className="landing-hero-brand-panel">
              <BrandLogo markOnly className="landing-hero-large-mark" />
              <div>
                <strong>律枢 LexHub</strong>
              </div>
            </div>
            <div className="landing-hero-statement">
              <h1 className="landing-hero-title">
                <span className="landing-title-line-primary">让法律事项</span>
                <span className="landing-title-line-accent">沿路径办理。</span>
              </h1>
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
            <article key={title} className="landing-quick-card neo-spotlight-card">
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
            <Link className="text-button" to={replayPath}>查看历史回放</Link>
          </div>
        </section>

        <section className="landing-logic-art" id="architecture" aria-label="处理逻辑视觉图">
          <div className="landing-section-head">
            <h2>办理逻辑</h2>
            <p className="landing-section-caption">事实进入系统，路径自动成形。</p>
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
            <h2>会员方案</h2>
            <p className="landing-section-caption">按事项规模选择合适的办理能力。</p>
          </div>
          <div className="landing-pricing-grid">
            {MEMBERSHIP_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`ds-card landing-pricing-card neo-reflective-card ${plan.id === 'pro' ? 'highlighted' : ''}`}
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
            <Link className="btn btn-primary neo-glow-button" to={workspacePath}>
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
