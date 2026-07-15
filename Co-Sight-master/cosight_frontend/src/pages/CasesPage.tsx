import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, CheckCircle2, Clock3, FileText, ShieldCheck } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import DataSourceBadge from '../components/ui/DataSourceBadge';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { useCaseProgress } from '../hooks/useCaseProgress';
import { clearAuthed } from '../lib/storage';

const fallbackStages = [
  { name: '场景识别', status: '待启动', detail: '确认合同审查、争议处理或合规咨询等事项类型。' },
  { name: '事实梳理', status: '待启动', detail: '抽取主体、时间线、争议焦点与待核验事实。' },
  { name: '证据质检', status: '待启动', detail: '识别缺失材料、矛盾点和 OCR 可解析内容。' },
  { name: '法规研究', status: '待启动', detail: '调用法规检索、案例检索与知识库增强结论。' },
  { name: '文书归档', status: '待启动', detail: '生成审查意见、律师函或归档摘要。' },
];

const fallbackActions = [
  '在事项受理页上传合同、协议或往来记录，启动一次法律事项办理。',
  '确认争议目标：风险提示、谈判方案、诉讼材料或内部合规意见。',
  '办理完成后在审查结论页查看法规引用与正式文书。',
];

function formatMaterialStatus(name: string): string {
  if (/合同|协议/.test(name)) return '已读取';
  if (/聊天|邮件|沟通/.test(name)) return '待上传';
  return '已归档';
}

function CasesPage() {
  const navigate = useNavigate();
  const { snapshot, workspacePath, materials, loading, source, progress } = useCaseProgress();

  const stages = useMemo(() => {
    if (!snapshot?.steps.length) return fallbackStages;
    return snapshot.steps.map((step) => ({
      name: step.title,
      status: step.statusLabel,
      detail: step.note || `办理状态：${step.statusLabel}`,
    }));
  }, [snapshot]);

  const nextActions = useMemo(() => {
    if (snapshot?.result) {
      const excerpt = snapshot.result.replace(/\s+/g, ' ').slice(0, 120);
      return [
        excerpt ? `最近事项结论：${excerpt}…` : '最近事项已完成，可在审查结论页查看完整输出。',
        snapshot.toolSummary.length
          ? `已记录处理动作：${snapshot.toolSummary.slice(0, 4).map((item) => item.name).join('、')}`
          : '建议复核法规引用与材料缺口后再导出文书。',
        workspacePath ? `案件工作区：${workspacePath}` : '可在历史回放页查看完整办理记录。',
      ];
    }
    return fallbackActions;
  }, [snapshot, workspacePath]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const badge = source === 'empty'
    ? <span className="ds-badge ds-badge-warning">暂无事项</span>
    : <DataSourceBadge source="api" />;

  return (
    <AppShell
      title="案件推进"
      subtitle="围绕阶段、材料和下一步动作推进法律事项。"
      badge={badge}
      actions={(
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/workspace/new')}>
          发起事项
        </button>
      )}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={Briefcase}
        title="案件推进中心"
        subtitle="从最近办理记录与材料库读取阶段进度，让每一步都有状态、责任和下一步建议。"
      />

      {loading && <LoadingState label="读取案件进度…" compact />}

      <section className="feature-stat-grid">
        <StatCard label="当前阶段" value={progress.label} description={snapshot ? '来自办理记录' : '等待发起事项'} />
        <StatCard
          label="阶段进度"
          value={snapshot ? `${progress.currentIndex + 1} / ${progress.total}` : '0 / 5'}
          description={snapshot ? `已完成 ${progress.completedCount} 步` : '暂无办理记录'}
        />
        <StatCard
          label="处理动作"
          value={snapshot ? `${snapshot.stats.toolCallCount}` : '—'}
          description={snapshot?.toolSummary[0] ? `主要动作：${snapshot.toolSummary[0].name}` : '等待事项办理'}
        />
        <StatCard label="质量校验" value="自动完成" description="出具前由核验智能体检查事实与依据一致性" />
      </section>

      <section className="feature-layout">
        <article className="ds-card feature-panel feature-panel-large">
          <div className="feature-panel-head">
            <div>
              <p className="eyebrow">CASE FLOW</p>
              <h2>业务阶段推进</h2>
            </div>
            <span className={`ds-badge ${snapshot ? 'ds-badge-success' : 'ds-badge-warning'}`}>
              {snapshot ? '已办理' : '待启动'}
            </span>
          </div>

          <div className="feature-stepper">
            {stages.map((stage, index) => (
              <div
                key={stage.name}
                className={`feature-step ${index <= progress.currentIndex ? 'active' : ''}`}
              >
                <span className="feature-step-index">{index + 1}</span>
                <div>
                  <strong>{stage.name}</strong>
                  <em>{stage.status}</em>
                  <p>{stage.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {snapshot && (
            <div className="cases-result-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/workspace/result')}>
                查看审查结论
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/replay')}>
                打开历史回放
              </button>
            </div>
          )}
        </article>

        <aside className="feature-side-stack">
          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <ShieldCheck size={18} />
              <strong>下一步建议</strong>
            </div>
            <div className="feature-check-list">
              {nextActions.map((item) => (
                <div key={item}>
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="ds-card feature-panel">
            <div className="feature-card-title">
              <FileText size={18} />
              <strong>关联材料</strong>
            </div>
            <div className="feature-mini-list">
              {materials.length > 0 ? materials.map((item) => (
                <div key={item.id}>
                  <span>{item.name}</span>
                  <em>{formatMaterialStatus(item.name)}</em>
                </div>
              )) : (
                <>
                  <div><span>合同文本</span><em>待上传</em></div>
                  <div><span>聊天记录</span><em>待上传</em></div>
                  <div><span>付款凭证</span><em>待核验</em></div>
                </>
              )}
            </div>
          </article>
        </aside>
      </section>

      <section className="ds-card feature-panel feature-panel-wide">
        <div className="feature-panel-head">
          <div>
            <p className="eyebrow">AGENT HANDOFF</p>
            <h2>专业角色协作交接</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/evidence')}>
            进入证据质检 <ArrowRight size={16} />
          </button>
        </div>
        <div className="feature-agent-grid">
          <div><Clock3 size={18} /><strong>事项受理</strong><span>拆解办理阶段与资料清单</span></div>
          <div><FileText size={18} /><strong>证据质检</strong><span>识别缺口、矛盾与可解析材料</span></div>
          <div><ShieldCheck size={18} /><strong>结论校验</strong><span>自动检查结论、依据与风险是否一致</span></div>
        </div>
      </section>
    </AppShell>
  );
}

export default CasesPage;
