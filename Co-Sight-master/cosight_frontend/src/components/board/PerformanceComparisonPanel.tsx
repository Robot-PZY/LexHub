import { TrendingUp } from 'lucide-react';
import type { PerformanceBenchmark } from '../../types/workflow';

type PerformanceComparisonPanelProps = {
  benchmark: PerformanceBenchmark;
  compact?: boolean;
};

function PerformanceComparisonPanel({ benchmark, compact = false }: PerformanceComparisonPanelProps) {
  const isReplay = benchmark.dataSource === 'replay';

  return (
    <section className={`ds-card performance-comparison-panel ${compact ? 'compact' : ''}`}>
      <div className="performance-comparison-head">
        <TrendingUp size={18} />
        <div>
          <p className="eyebrow">PERFORMANCE BENCHMARK</p>
          <strong>{benchmark.title}</strong>
          {benchmark.note ? <em>{benchmark.note}</em> : null}
        </div>
        <span className={`ds-badge ${isReplay ? 'ds-badge-success' : 'ds-badge-warning'}`}>
          {isReplay ? `replay 实测 · ${benchmark.sampleCount ?? 0} 条` : '待实测'}
        </span>
      </div>

      {!compact && (
        <div className="performance-summary-grid">
          <div>
            <span>效率提升</span>
            <strong>{benchmark.summary.efficiencyGain}</strong>
          </div>
          <div>
            <span>准确率提升</span>
            <strong>{benchmark.summary.accuracyGain}</strong>
          </div>
          <div>
            <span>回放覆盖</span>
            <strong>{benchmark.summary.replayCoverage}</strong>
          </div>
        </div>
      )}

      <div className="performance-table">
        <div className="performance-table-head">
          <span>指标</span>
          <span>传统方案</span>
          <span>Co-Sight</span>
          <span>提升</span>
        </div>
        {benchmark.metrics.map((metric) => (
          <div key={metric.label} className="performance-table-row">
            <strong>{metric.label}</strong>
            <span>{metric.traditional}</span>
            <span className="cosight-value">{metric.cosight}</span>
            <em>{metric.improvement}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PerformanceComparisonPanel;
