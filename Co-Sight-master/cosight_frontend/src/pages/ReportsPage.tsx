import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Download, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import ExecutionExportActions from '../components/documents/ExecutionExportActions';
import DataSourceBadge from '../components/ui/DataSourceBadge';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { useDemoResource } from '../hooks/useDemoResource';
import { useLatestExecutionSnapshot } from '../hooks/useLatestExecutionSnapshot';
import { buildReportExportPayload } from '../lib/document-export';
import { fetchReportSummary } from '../lib/api';
import { mockReportSummary } from '../mocks/report';
import { clearAuthed } from '../lib/storage';

function ReportsPage() {
  const navigate = useNavigate();
  const { data, source, loading } = useDemoResource(fetchReportSummary, mockReportSummary);
  const { snapshot, loading: snapshotLoading } = useLatestExecutionSnapshot();
  const [exportHint, setExportHint] = useState<string | null>(null);

  const exportPayload = useMemo(
    () => buildReportExportPayload('docx', data.title, data.sections, snapshot),
    [data.title, data.sections, snapshot],
  );

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="总结报告"
      subtitle="汇总办理过程、证据材料、依据研究、风险审查和输出建议。"
      badge={<DataSourceBadge source={source} />}
      actions={(
        <ExecutionExportActions
          payload={!loading ? exportPayload : null}
          className="documents-export-actions"
          onSuccess={(fileName) => setExportHint(`已下载：${fileName}`)}
        />
      )}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={BarChart3}
        title="事项总结报告"
        subtitle="报告正文优先写入最近办理记录；概览数据用于快速理解事项状态。"
      />

      {exportHint && <div className="admin-save-hint">{exportHint}</div>}
      {snapshotLoading && <LoadingState label="同步最近办理记录…" compact />}

      {loading ? <LoadingState label="加载报告数据…" /> : (
        <>
          <section className="feature-stat-grid">
            <StatCard label="协作角色" value={`${data.stats.agents}`} description="含结论复核角色" />
            <StatCard label="关键发现" value={`${data.stats.findings}`} description="证据、条款、引用、输出风险" />
            <StatCard label="报告状态" value={data.stats.status} description="可导出前需复核" />
            <StatCard label="记录来源" value={snapshot ? '最近办理' : '概览数据'} description={snapshot ? `${snapshot.stats.toolCallCount} 次处理动作` : '待事项办理'} />
          </section>

          <section className="feature-layout">
            <article className="ds-card feature-panel feature-panel-large">
              <div className="feature-panel-head">
                <div>
                  <p className="eyebrow">EXECUTIVE REPORT</p>
                  <h2>{snapshot?.title ?? data.title}</h2>
                </div>
                <span className="ds-badge ds-badge-primary">可归档</span>
              </div>

              <div className="report-outline">
                {(snapshot
                  ? snapshot.steps.map((step) => ({ title: `阶段 ${step.index + 1}`, desc: `[${step.statusLabel}] ${step.title}` }))
                  : data.sections
                ).map((section, index) => (
                  <article key={`${section.title}-${index}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{section.title}</strong>
                      <p>{section.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <aside className="feature-side-stack">
              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <Sparkles size={18} />
                  <strong>报告价值</strong>
                </div>
                <div className="feature-mini-list">
                  <div><span>过程可解释</span><em>展示办理路径</em></div>
                  <div><span>依据可追溯</span><em>引用来源</em></div>
                  <div><span>结果可复核</span><em>审查意见</em></div>
                </div>
              </article>

              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <Download size={18} />
                  <strong>导出配置</strong>
                </div>
                <ExecutionExportActions
                  payload={exportPayload}
                  onSuccess={(fileName) => setExportHint(`已下载：${fileName}`)}
                />
              </article>
            </aside>
          </section>

          <section className="ds-card feature-panel feature-panel-wide">
            <div className="feature-panel-head">
              <div>
                <p className="eyebrow">FINAL HANDOFF</p>
                <h2>下一步处理建议</h2>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/profiles')}>查看画像分析</button>
            </div>
            <div className="feature-agent-grid">
              {data.nextActions.map((action) => (
                <div key={action.title}>
                  {action.title === '补齐材料' && <FileText size={18} />}
                  {action.title === '自动校验' && <ShieldCheck size={18} />}
                  {action.title === '导出归档' && <Download size={18} />}
                  <strong>{action.title}</strong>
                  <span>{action.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

export default ReportsPage;
