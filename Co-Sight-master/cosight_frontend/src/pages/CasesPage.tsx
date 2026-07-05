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
  { name: '场景识别', status: '待启动', detail: '确认合同审查、争议处理或合规咨询等任务类型。' },
  { name: '事实梳理', status: '待启动', detail: '抽取主体、时间线、争议焦点与待核验事实。' },
  { name: '证据质检', status: '待启动', detail: '识别缺失材料、矛盾点和 OCR 可解析内容。' },
  { name: '法规研究', status: '待启动', detail: '调用法规检索、案例检索与知识库增强结论。' },
  { name: '文书归档', status: '待启动', detail: '生成审查意见、律师函或归档摘要。' },
];

const fallbackActions = [
  '在工作台上传合同、协议或往来记录，启动一次 Co-Sight 任务。',
  '确认争议目标：风险提示、谈判方案、诉讼材料或内部合规意见。',
  '任务完成后在结果页查看工具轨迹与法规引用，再进入文书生成。',
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
      detail: step.note || `执行状态：${step.statusLabel}`,
    }));
  }, [snapshot]);

  const nextActions = useMemo(() => {
    if (snapshot?.result) {
      const excerpt = snapshot.result.replace(/\s+/g, ' ').slice(0, 120);
      return [
        excerpt ? `最近任务结论：${excerpt}…` : '最近任务已完成，可在结果页查看完整输出。',
        snapshot.toolSummary.length
          ? `已调用工具：${snapshot.toolSummary.slice(0, 4).map((item) => item.name).join('、')}`
          : '建议复核法规引用与材料缺口后再导出文书。',
        workspacePath ? `工作区：${workspacePath}` : '可在回放页查看完整执行轨迹。',
      ];
    }
    return fallbackActions;
  }, [snapshot, workspacePath]);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  const badge = source === 'empty'
    ? <span className="ds-badge ds-badge-warning">暂无任务</span>
    : <DataSourceBadge source="api" />;

  return (
    <AppShell
      title="案件推进"
      subtitle="围绕阶段、材料和下一步动作推进法律任务。"
      badge={badge}
      actions={(
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/workspace')}>
          发起任务
        </button>
      )}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={Briefcase}
        title="案件推进中心"
        subtitle="从最近 Co-Sight 执行记录与材料库读取阶段进度，让每一步都有状态、责任和下一步建议。"
      />

      {loading && <LoadingState label="读取案件进度…" compact />}

      <section className="feature-stat-grid">
        <StatCard label="当前阶段" value={progress.label} description={snapshot ? '来自执行快照' : '等待发起任务'} />
        <StatCard
          label="阶段进度"
          value={snapshot ? `${progress.currentIndex + 1} / ${progress.total}` : '0 / 5'}
          description={snapshot ? `已完成 ${progress.completedCount} 步` : '暂无执行记录'}
        />
        <StatCard
          label="工具调用"
          value={snapshot ? `${snapshot.stats.toolCallCount}` : '—'}
          description={snapshot?.toolSummary[0] ? `主力：${snapshot.toolSummary[0].name}` : '等待任务执行'}
        />
        <StatCard label="复核要求" value="人工确认" description="正式出具前保留人工审核节点" />
      </section>

      <section className="feature-layout">
        <article className="ds-card feature-panel feature-panel-large">
          <div className="feature-panel-head">
            <div>
              <p className="eyebrow">CASE FLOW</p>
              <h2>业务阶段推进</h2>
            </div>
            <span className={`ds-badge ${snapshot ? 'ds-badge-success' : 'ds-badge-warning'}`}>
              {snapshot ? '真实执行' : '待启动'}
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
                查看任务结果
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/replay')}>
                打开回放中心
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
            <h2>智能体协作交接</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/evidence')}>
            进入证据质检 <ArrowRight size={16} />
          </button>
        </div>
        <div className="feature-agent-grid">
          <div><Clock3 size={18} /><strong>规划智能体</strong><span>拆解任务阶段与资料清单</span></div>
          <div><FileText size={18} /><strong>证据智能体</strong><span>识别缺口、矛盾与 OCR 结果</span></div>
          <div><ShieldCheck size={18} /><strong>复核智能体</strong><span>标记需要人工确认的结论</span></div>
        </div>
      </section>
    </AppShell>
  );
}

export default CasesPage;
