import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react';
import AuditLogPanel from '../components/audit/AuditLogPanel';
import AppShell from '../components/layout/AppShell';
import DataSourceBadge from '../components/ui/DataSourceBadge';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { useDemoResource } from '../hooks/useDemoResource';
import { fetchReviewResult } from '../lib/api';
import { mockReviewResult } from '../mocks/review';
import { clearAuthed } from '../lib/storage';

function ReviewPage() {
  const navigate = useNavigate();
  const { data, source, loading } = useDemoResource(fetchReviewResult, mockReviewResult);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="审查结果"
      subtitle="结论复核角色对事实、证据、法规和文书进行一致性审查。"
      badge={<DataSourceBadge source={source} />}
      actions={<button type="button" className="btn btn-primary" onClick={() => navigate('/reports')}>生成报告</button>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={ShieldCheck}
        title="结论复核结果"
        subtitle="系统不替代专业判断，而是标记不一致、缺依据和可能产生风险的部分。"
      />

      {loading ? <LoadingState label="加载审查结果…" /> : (
        <>
          <section className="feature-stat-grid">
            <StatCard label="审查维度" value={`${data.stats.dimensions}`} description="事实、证据、法规、文书" />
            <StatCard label="通过项" value={`${data.stats.passed}`} description="事实一致性初步通过" />
            <StatCard label="需补证" value={`${data.stats.warnings}`} description="证据与引用仍需补齐" />
            <StatCard label="输出等级" value={data.stats.outputLevel} description={data.overallVerdict} />
          </section>

          <section className="feature-layout">
            <article className="ds-card feature-panel feature-panel-large">
              <div className="feature-panel-head">
                <div>
                  <p className="eyebrow">REVIEW MATRIX</p>
                  <h2>审查矩阵</h2>
                </div>
                <span className="ds-badge ds-badge-primary">可追溯</span>
              </div>

              <div className="feature-quality-grid">
                {data.reviewItems.map((item) => (
                  <div key={item.label} className={`feature-quality-card ${item.tone}`}>
                    <CheckCircle2 size={18} />
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="feature-research-result">
                <div className="feature-card-title">
                  <FileWarning size={18} />
                  <strong>审查结论</strong>
                </div>
                <p>
                  {data.overallVerdict}
                  {data.dataSource === 'replay'
                    ? '。审查矩阵与审计链均来自最新真实办理记录。'
                    : '。请先在事项受理页完成一次办理，以生成审查数据。'}
                </p>
              </div>
            </article>

            <aside className="feature-side-stack">
              {data.auditLog ? (
                <AuditLogPanel auditLog={data.auditLog} compact />
              ) : null}

              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <AlertTriangle size={18} />
                  <strong>风险发现</strong>
                </div>
                <div className="feature-alert-list">
                  {data.riskFindings.map((item) => <div key={item}>{item}</div>)}
                </div>
              </article>

              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <ShieldCheck size={18} />
                  <strong>复核动作</strong>
                </div>
                <div className="feature-mini-list">
                  <div><span>补齐证据</span><em>返回证据页</em></div>
                  <div><span>补充引用</span><em>返回研究页</em></div>
                  <div><span>确认输出</span><em>进入报告页</em></div>
                </div>
              </article>
            </aside>
          </section>
        </>
      )}
    </AppShell>
  );
}

export default ReviewPage;
