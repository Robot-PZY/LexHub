import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  Crown,
  FileSearch,
  FileCheck2,
  FolderArchive,
  Network,
  Search,
  Scale,
  ShieldCheck,
  Workflow,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/app/BrandLogo';
import MarketingFooter from '../components/layout/MarketingFooter';
import StatCard from '../components/ui/StatCard';
import { MEMBERSHIP_PLANS } from '../config/membership';
import {
  fetchDemoRuntimeStatus,
} from '../lib/api';
import { defaultAgentRegistry } from '../lib/agent-registry';
import { isAuthed } from '../lib/storage';
import type { DemoRuntimeStatus } from '../types/demo';

const topNavItems = [
  { label: '产品能力', href: '#capabilities' },
  { label: '智能体协作', href: '#agents' },
  { label: '办理流程', href: '#workflow' },
  { label: '解决方案', href: '#scenes' },
  { label: '会员方案', href: '#pricing' },
];

const agentIcons = [Network, FileSearch, Scale, Search, ShieldCheck, Workflow, FileCheck2, Check];
const orchestrationAgents = defaultAgentRegistry.agents.map((agent, index) => ({
  title: agent.name,
  desc: agent.capabilities.join('、'),
  icon: agentIcons[index] ?? Workflow,
  state: agent.role === 'orchestrator' ? '编排' : agent.role === 'reviewer' ? '校验' : '执行',
}));

const orchestrationTrace = [
  { agent: '规划智能体', tool: '任务编排', result: '生成 5 个办理阶段', state: 'done' },
  { agent: '材料理解智能体', tool: '百度 OCR · 文档解析', result: '抽取 12 个合同条款', state: 'done' },
  { agent: '法规检索智能体', tool: '法律检索 · 联网搜索', result: '正在核验引用依据', state: 'running' },
  { agent: '报告生成智能体', tool: '报告生成', result: '等待阶段输入', state: 'pending' },
];

const capabilityItems = [
  { title: '事项受理', desc: '提交材料和办理需求。', icon: Scale },
  { title: '任务规划', desc: '生成步骤和执行顺序。', icon: Workflow },
  { title: '材料检查', desc: '检查材料是否完整。', icon: FileSearch },
  { title: '结果归档', desc: '保存报告、依据和执行记录。', icon: FolderArchive },
];

const workflowSteps = [
  { title: '提交事项', desc: '输入事实、材料与目标产出' },
  { title: '生成任务', desc: '拆分步骤并确定执行顺序' },
  { title: '执行任务', desc: '调用检索、分析和文书工具' },
  { title: '交付归档', desc: '生成报告并保存办理记录' },
];

const scenes = [
  { title: '合同审查', desc: '风险条款、履约证据、修改建议', icon: ShieldCheck },
  { title: '公司事务', desc: '股权、章程、决议与治理材料', icon: Building2 },
  { title: '争议解决', desc: '事实时间线、证据清单、策略建议', icon: Scale },
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
        { label: '归档状态', value: '就绪', tone: 'success' },
      ],
      nodes: [
        { label: '事项受理', caption: '事实与材料', state: 'done' },
        { label: '证据质检', caption: '完整度核验', state: 'done' },
        { label: '法规研究', caption: '依据检索中', state: 'active' },
        { label: '文书生成', caption: '待交付', state: 'pending' },
      ],
      alert: { title: '违约责任条款需复核', caption: '建议检查', tone: 'warning' },
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
        { label: '报告状态', value: '完成', tone: 'success' },
      ],
      nodes: [
        { label: '事实摘要', caption: '争议焦点', state: 'done' },
        { label: '风险分层', caption: '条款识别', state: 'active' },
        { label: '依据引用', caption: '法条来源', state: 'done' },
        { label: '自动校验', caption: '一致性检查', state: 'pending' },
      ],
      alert: { title: '管辖条款存在不确定性', caption: '需要补充材料', tone: 'warning' },
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
        { label: '归档状态', value: '已保存', tone: 'success' },
      ],
      nodes: [
        { label: '报告生成', caption: '审查结论', state: 'done' },
        { label: '审查意见', caption: '文书草稿', state: 'active' },
        { label: '材料归档', caption: '记录沉淀', state: 'done' },
        { label: '再次复核', caption: '交叉检查', state: 'pending' },
      ],
      alert: { title: '审查意见书已生成', caption: '可以导出', tone: 'success' },
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
        <span>律枢 · 事项路径</span>
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
                  <span>律枢 · 事项路径</span>
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
  const membershipPath = authed ? '/membership' : '/login';
  const [runtimeStatus, setRuntimeStatus] = useState<DemoRuntimeStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const runtimeData = await fetchDemoRuntimeStatus().catch(() => null);
        if (!cancelled) {
          setRuntimeStatus(runtimeData);
        }
      } catch {
        if (!cancelled) {
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
    <div className="landing-hub-shell lex-public-landing lex-landing-v3">
      <header className="landing-top-bar ds-animate-in">
        <BrandLogo subtitle="法律智能工作台" />
        <nav className="landing-top-nav" aria-label="首页导航">
          {topNavItems.map(({ label, href }) => (
            <a key={label} href={href}>{label}</a>
          ))}
        </nav>
        <div className="landing-top-actions">
          {!authed && <Link className="btn btn-ghost" to="/login">登录</Link>}
          <Link className="btn btn-primary" to={workspacePath}>
            {authed ? '进入事项受理' : '发起事项'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="landing-hub-main">
        <section className="landing-hero-showcase ds-animate-in" id="home">
          <div className="landing-hero-copy-block">
            <div className="landing-hero-statement">
              <h1 className="landing-hero-title">
                <span className="landing-title-line-primary">提交材料，</span>
                <span className="landing-title-line-accent">开始办理。</span>
              </h1>
              <div className="landing-hero-actions">
                <Link className="btn btn-primary" to={workspacePath}>
                  新建事项
                  <ArrowRight size={16} />
                </Link>
                <a className="btn btn-secondary" href="#agents">查看智能体协作</a>
              </div>
              <div className="landing-hero-proof" aria-label="核心能力">
                <span><Check size={14} /> 办理路径</span>
                <span><Check size={14} /> 工具调用记录</span>
                <span><Check size={14} /> 报告与办理记录</span>
              </div>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section className="landing-metrics-strip">
          <StatCard label="运行状态" value={isReady ? 'Ready' : 'Standby'} description={runtimeStatus?.summary ?? '系统状态'} />
          <StatCard label="智能体协作" value={`${defaultAgentRegistry.agents.length}`} description={`${defaultAgentRegistry.agents.length} 个专业智能体`} />
          <StatCard label="任务编排" value="DAG" description="显示步骤与依赖" />
          <StatCard label="结果交付" value="报告 + 归档" description="结果、依据与轨迹统一保存" />
        </section>

        <section className="landing-capability-section" id="capabilities">
          <div className="landing-section-head">
            <h2>产品能力</h2>
            <p className="landing-section-caption">受理、分析、审查和归档。</p>
          </div>
          <div className="landing-quick-grid">
            {capabilityItems.map(({ title, desc, icon: Icon }, index) => (
              <article key={title} className={`landing-quick-card landing-quick-card-${index + 1}`}>
                <Icon size={18} />
                <div>
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-agent-section" id="agents">
          <div className="landing-agent-heading">
            <h2>智能体协作</h2>
            <p className="landing-agent-subtitle">角色、工具和进度</p>
            <p className="landing-agent-description">查看每个智能体负责什么、调用了什么、执行到哪一步。</p>
          </div>

          <div className="landing-agent-showcase">
            <div className="landing-agent-map" aria-label="智能体协作路径">
              {orchestrationAgents.map(({ title, desc, icon: Icon, state }, index) => (
                <article key={title} className={`landing-agent-node node-${index + 1}`}>
                  <div><Icon size={18} /></div>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                  <em>{state}</em>
                </article>
              ))}
            </div>

            <div className="landing-agent-trace">
              <div className="landing-agent-trace-head">
                <div><Wrench size={17} /><strong>工具调用记录</strong></div>
                <span><i /> 执行中</span>
              </div>
              <div className="landing-agent-trace-list">
                {orchestrationTrace.map((item) => (
                  <article key={item.agent} className={`landing-agent-trace-item ${item.state}`}>
                    <div>
                      <strong>{item.agent}</strong>
                      <p>{item.tool}</p>
                      <em>{item.result}</em>
                    </div>
                    <span className="landing-agent-trace-state">
                      {item.state === 'done' ? '成功' : item.state === 'running' ? '调用中' : '待执行'}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-workflow-card" id="workflow">
          <div className="landing-workflow-intro">
            <div>
              <div className="landing-section-title">
                <BookOpenCheck size={18} />
                <h2>办理流程</h2>
              </div>
              <p className="landing-section-caption">提交需求、执行任务、查看结果。</p>
            </div>
          </div>
          <div className="landing-workflow-line">
            {workflowSteps.map(({ title, desc }) => (
              <div key={title} className="landing-workflow-step">
                <span aria-hidden="true" />
                <strong>{title}</strong>
                <em>{desc}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-bottom-grid" id="scenes">
          <div className="landing-scenes-card">
            <div className="landing-scenes-heading">
              <div className="landing-section-title">
                <Scale size={18} />
                <h2>解决方案</h2>
              </div>
            </div>
            <div className="landing-scene-list">
              {scenes.map(({ title, desc, icon: Icon }) => (
                <Link key={title} to={workspacePath}>
                  <Icon size={18} />
                  <span>
                    <strong>{title}</strong>
                    <em>{desc}</em>
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          </div>

        </section>

        <section className="landing-pricing-section" id="pricing">
          <div className="landing-section-head">
            <h2>会员方案</h2>
            <p className="landing-section-caption">查看不同方案包含的功能。</p>
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
            <h2>新建法律事项</h2>
          </div>
          <div className="landing-cta-actions">
            <Link className="btn btn-primary" to={workspacePath}>
              <span>开始办理</span>
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
