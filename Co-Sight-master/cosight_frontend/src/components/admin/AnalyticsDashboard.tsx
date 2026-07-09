import { Activity, BarChart3, Bot, Gauge, ShieldAlert } from 'lucide-react';
import PerformanceComparisonPanel from '../board/PerformanceComparisonPanel';
import DataSourceBadge from '../ui/DataSourceBadge';
import LoadingState from '../ui/LoadingState';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import { useDemoResource } from '../../hooks/useDemoResource';
import { fetchAnalyticsOverview } from '../../lib/api';
import { mockAnalyticsOverview } from '../../mocks/analytics';
import { mockPerformanceBenchmark } from '../../mocks/workflow';

function maxValue(items: Array<{ value: number }>) {
  return Math.max(...items.map((item) => item.value), 1);
}

type AnalyticsDashboardProps = {
  variant?: 'user' | 'admin';
  badge?: React.ReactNode;
};

function AnalyticsDashboard({ variant = 'user', badge }: AnalyticsDashboardProps) {
  const { data, source, loading } = useDemoResource(fetchAnalyticsOverview, mockAnalyticsOverview);
  const stageMax = maxValue(data.caseStages);
  const agentMax = maxValue(data.agentCalls);
  const trendMax = maxValue(data.completenessTrend);
  const isAdmin = variant === 'admin';

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title={isAdmin ? '运营数据分析' : '律枢分析驾驶舱'}
        subtitle={isAdmin
          ? '从管理端观察事项闭环、协作角色与外部服务就绪情况，用于运营巡检。'
          : '基于事项办理闭环的运行数据概览，帮助快速理解系统状态与服务覆盖。'}
        action={badge ?? <DataSourceBadge source={source} />}
      />

      {loading ? <LoadingState label="加载分析数据…" /> : (
        <>
          <section className="feature-stat-grid">
            <StatCard label="案件总数" value={`${data.summary.totalCases}`} description="含归档与进行中事项" />
            <StatCard label="高风险占比" value={`${data.summary.highRiskRatio}%`} description="触发强制审查比例" />
            <StatCard label="角色协作" value={`${data.summary.agentCalls}`} description="累计介入次数" />
            <StatCard label="服务就绪率" value={`${data.summary.apiReadyRatio}%`} description="已配置的外部服务" />
          </section>

          <section className="analytics-grid">
            <article className="ds-card analytics-panel">
              <div className="analytics-panel-head">
                <Activity size={18} />
                <strong>案件阶段分布</strong>
              </div>
              <div className="analytics-bar-chart">
                {data.caseStages.map((item) => (
                  <div key={item.label} className="analytics-bar-row">
                    <span>{item.label}</span>
                    <div className="analytics-bar-track">
                      <i style={{ width: `${(item.value / stageMax) * 100}%` }} />
                    </div>
                    <em>{item.value}</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="ds-card analytics-panel">
              <div className="analytics-panel-head">
                <ShieldAlert size={18} />
                <strong>风险等级分布</strong>
              </div>
              <div className="analytics-risk-grid">
                {data.riskDistribution.map((item) => (
                  <div key={item.label} className={`analytics-risk-card ${item.tone}`}>
                    <strong>{item.label}</strong>
                    <span>{item.value}%</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="ds-card analytics-panel">
              <div className="analytics-panel-head">
                <Gauge size={18} />
                <strong>材料完整度趋势</strong>
              </div>
              <div className="analytics-trend-chart">
                {data.completenessTrend.map((item) => (
                  <div key={item.label} className="analytics-trend-col">
                    <i style={{ height: `${(item.value / trendMax) * 100}%` }} />
                    <span>{item.label}</span>
                    <em>{item.value}%</em>
                  </div>
                ))}
              </div>
            </article>

            <article className="ds-card analytics-panel">
              <div className="analytics-panel-head">
                <Bot size={18} />
                <strong>协作角色介入次数</strong>
              </div>
              <div className="analytics-bar-chart">
                {data.agentCalls.map((item) => (
                  <div key={item.label} className="analytics-bar-row">
                    <span>{item.label}</span>
                    <div className="analytics-bar-track">
                      <i style={{ width: `${(item.value / agentMax) * 100}%` }} />
                    </div>
                    <em>{item.value}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {data.apiStatus.length > 0 && (
            <section className="ds-card analytics-panel analytics-panel-wide">
              <div className="analytics-panel-head">
                <strong>外部服务状态</strong>
              </div>
              <div className="analytics-api-grid">
                {data.apiStatus.map((item) => (
                  <div key={item.id} className="analytics-api-card">
                    <strong>{item.name}</strong>
                    <em className={item.status}>
                      {item.status === 'ready' ? '已配置' : item.status === 'missing_key' ? '待补 Key' : '预留'}
                    </em>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="landing-section" style={{ marginTop: 24 }}>
            <PerformanceComparisonPanel
              benchmark={data.performanceBenchmark ?? mockPerformanceBenchmark}
            />
          </section>
        </>
      )}
    </>
  );
}

export default AnalyticsDashboard;
