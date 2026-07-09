import { useNavigate } from 'react-router-dom';
import { Building2, Gauge, Network, UserRoundSearch } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import DataSourceBadge from '../components/ui/DataSourceBadge';
import LoadingState from '../components/ui/LoadingState';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { useDemoResource } from '../hooks/useDemoResource';
import { fetchProfileAnalysis } from '../lib/api';
import { mockProfileAnalysis } from '../mocks/profile';
import { clearAuthed } from '../lib/storage';

const profileIcons = [Gauge, Network, Building2];

function ProfilesPage() {
  const navigate = useNavigate();
  const { data, source, loading } = useDemoResource(fetchProfileAnalysis, mockProfileAnalysis);

  const handleLogout = () => {
    clearAuthed();
    navigate('/login');
  };

  return (
    <AppShell
      title="画像分析"
      subtitle="从案件、证据、主体和办理目标构建业务画像。"
      badge={<DataSourceBadge source={source} />}
      actions={<button type="button" className="btn btn-secondary" onClick={() => navigate('/agents')}>查看调度</button>}
      onLogout={handleLogout}
    >
      <PageHeader
        icon={UserRoundSearch}
        title="法律业务画像分析"
        subtitle="画像帮助系统判断调度策略、风险等级和下一步动作，而非营销标签。"
      />

      {loading ? <LoadingState label="加载画像数据…" /> : (
        <>
          <section className="feature-stat-grid">
            <StatCard label="案件类型" value={data.stats.caseType} description="基于事项描述自动识别" />
            <StatCard label="风险等级" value={data.stats.riskLevel} description="证据缺口影响输出确定性" />
            <StatCard label="材料核验" value={data.stats.entityCheck} description="基于合同与往来材料" />
            <StatCard label="推荐路径" value={data.stats.recommendedPath} description="不建议直接导出正式意见" />
          </section>

          <section className="feature-layout">
            <article className="ds-card feature-panel feature-panel-large">
              <div className="feature-panel-head">
                <div>
                  <p className="eyebrow">PROFILE INSIGHT</p>
                  <h2>画像维度</h2>
                </div>
                <span className="ds-badge ds-badge-warning">影响调度策略</span>
              </div>

              <div className="profile-card-grid">
                {data.profileCards.map(({ title, items }, index) => {
                  const Icon = profileIcons[index % profileIcons.length];
                  return (
                    <article key={title} className="profile-card">
                      <Icon size={20} />
                      <strong>{title}</strong>
                      {items.map((item) => <span key={item}>{item}</span>)}
                    </article>
                  );
                })}
              </div>
            </article>

            <aside className="feature-side-stack">
              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <Gauge size={18} />
                  <strong>画像评分</strong>
                </div>
                <div className="feature-quality-grid profile-score-grid">
                  {data.dimensions.map((item) => (
                    <div key={item.label} className={`feature-quality-card ${item.tone}`}>
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="ds-card feature-panel">
                <div className="feature-card-title">
                  <Building2 size={18} />
                  <strong>外部数据预留</strong>
                </div>
                <div className="feature-mini-list">
                  {data.externalData.map((item) => (
                    <div key={item.label}><span>{item.label}</span><em>{item.status}</em></div>
                  ))}
                </div>
              </article>
            </aside>
          </section>
        </>
      )}
    </AppShell>
  );
}

export default ProfilesPage;
