import { Bot, BrainCircuit, CheckCircle2, Eye, FileSearch, GitBranch, PenLine, ShieldCheck, Zap } from 'lucide-react';
import DataSourceBadge from '../ui/DataSourceBadge';
import LoadingState from '../ui/LoadingState';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import { useDemoResource } from '../../hooks/useDemoResource';
import { fetchAgentRouting } from '../../lib/api';
import { mockAgentCatalog, mockAgentRouting } from '../../mocks/routing';
import { deriveAgentInvocations } from '../../lib/dag-utils';

const capabilityLayers = [
  { icon: BrainCircuit, title: '语言推理', desc: '任务理解、法规研究、文书生成、交叉审查' },
  { icon: Eye, title: '视觉与 OCR', desc: '合同扫描、票据识图、PDF 材料解析' },
  { icon: FileSearch, title: '外部检索', desc: '得理法规案例、联网搜索、本地知识库' },
  { icon: PenLine, title: '交付导出', desc: '报告、律师函、材料包与审计链' },
];

type AgentsDemoPanelProps = {
  variant?: 'user' | 'admin';
  badge?: React.ReactNode;
};

function AgentsDemoPanel({ variant = 'user', badge }: AgentsDemoPanelProps) {
  const { data: routing, source, loading } = useDemoResource(
    () => fetchAgentRouting({
      scenario: 'contract_review',
      description: '审查合作协议中的付款、违约责任和争议解决条款风险，并准备律师函草稿。',
    }),
    mockAgentRouting,
  );
  const isAdmin = variant === 'admin';

  const invocations = deriveAgentInvocations(
    routing.activeAgents.map((agent, index) => ({
      id: agent.id,
      stepIndex: index,
      title: agent.name,
      status: agent.status === 'active' ? 'running' : agent.status === 'completed' ? 'completed' : 'pending',
      summary: agent.reason,
      agent: agent.id === 'drafting' ? 'generation' : agent.id === 'research' ? 'retrieval' : agent.id === 'evidence' ? 'analysis' : agent.id === 'planner' ? 'planner' : 'review',
      timestamp: Date.now(),
    })),
    [],
  );

  return (
    <>
      <PageHeader
        icon={Bot}
        title={isAdmin ? '智能体能力演示' : '智能体调度中心'}
        subtitle={isAdmin
          ? '展示 Co-Sight 多智能体编排：不仅包含 LLM，还涵盖 OCR、检索 API 与规则审查等异构能力。'
          : '系统会根据案件类型、材料状态、风险等级和目标产出自动选择智能体，并在必要时返工或进入人工复核。'}
        action={badge ?? <DataSourceBadge source={source} />}
      />

      {loading ? <LoadingState label="加载调度数据…" /> : (
        <>
          <section className="admin-capability-banner">
            {capabilityLayers.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="admin-capability-banner-card">
                  <Icon size={18} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="feature-stat-grid">
            <StatCard label="可调度智能体" value="5" description="理解、证据、研究、生成、审查" />
            <StatCard label="当前激活" value={`${routing.activeAgents.filter((a) => a.status === 'active').length}`} description="状态驱动，非固定顺序" />
            <StatCard label="复核策略" value={routing.reviewRequired ? '强制审查' : '按需审查'} description="高风险输出进入审查智能体" />
            <StatCard label="风险等级" value={routing.metrics.riskLevel === 'high' ? '高' : routing.metrics.riskLevel === 'medium' ? '中' : '低'} description={`材料 ${routing.metrics.materialCompleteness}%`} />
          </section>

          <section className="feature-layout">
            <article className="ds-card feature-panel feature-panel-large">
              <div className="feature-panel-head">
                <div>
                  <p className="eyebrow">ROUTING MAP</p>
                  <h2>当前任务的动态调度网络</h2>
                </div>
                <span className="ds-badge ds-badge-success">可解释</span>
              </div>

              <div className="agent-routing-map">
                {routing.activeAgents.map((agent, index) => (
                  <article key={agent.id} className={`agent-routing-node ${agent.status}`}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{agent.name}</strong>
                      <p>触发：{agent.trigger}</p>
                      <em>{agent.reason}</em>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <aside className="feature-side-stack">
              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <BrainCircuit size={18} />
                  <strong>调度决策</strong>
                </div>
                <div className="feature-check-list">
                  {routing.routingDecisions.map((item) => (
                    <div key={item}>
                      <CheckCircle2 size={16} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <Zap size={18} />
                  <strong>触发信号</strong>
                </div>
                <div className="feature-mini-list">
                  <div><span>材料缺口</span><em>证据质检智能体</em></div>
                  <div><span>法规缺失</span><em>法规研究智能体</em></div>
                  <div><span>导出前</span><em>交叉审查智能体</em></div>
                </div>
              </article>
            </aside>
          </section>

          <section className="ds-card feature-panel feature-panel-wide">
            <div className="feature-panel-head">
              <div>
                <p className="eyebrow">RUNTIME EVIDENCE</p>
                <h2>智能体参与证据（调度结果）</h2>
              </div>
            </div>
            <div className="agent-evidence-grid">
              {invocations.map((item) => (
                <article key={item.agent} className="agent-evidence-card">
                  <strong>{item.label}</strong>
                  <div className="agent-evidence-stats">
                    <span>{item.steps} 个阶段</span>
                    <span>{item.tools} 次工具</span>
                  </div>
                  <p>{item.lastAction}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="ds-card feature-panel feature-panel-wide">
            <div className="feature-panel-head">
              <div>
                <p className="eyebrow">AGENT OUTPUT</p>
                <h2>智能体输入与输出</h2>
              </div>
              <span className="ds-badge ds-badge-warning">可接真实运行记录</span>
            </div>
            <div className="feature-agent-grid">
              {mockAgentCatalog.slice(1).map((agent) => (
                <div key={agent.name}>
                  <GitBranch size={18} />
                  <strong>{agent.name}</strong>
                  <span>{agent.output}</span>
                </div>
              ))}
              <div>
                <ShieldCheck size={18} />
                <strong>交叉审查结果</strong>
                <span>判断事实、证据、法规和文书是否互相支撑。</span>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default AgentsDemoPanel;
