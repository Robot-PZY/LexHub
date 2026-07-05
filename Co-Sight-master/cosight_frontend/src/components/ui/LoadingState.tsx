import { Loader2 } from 'lucide-react';

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

function LoadingState({ label = '加载中...', compact = false }: LoadingStateProps) {
  if (compact) {
    return (
      <div className="ds-loading" style={{ padding: '12px 16px' }}>
        <div className="ds-spinner" />
        <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>{label}</span>
      </div>
    );
  }

  return (
    <div className="ds-empty">
      <div className="ds-empty-icon">
        <Loader2 size={22} className="ds-spin-icon" style={{ animation: 'ds-spin 0.7s linear infinite' }} />
      </div>
      <strong>{label}</strong>
      <span>请稍候，正在获取最新数据</span>
    </div>
  );
}

export default LoadingState;
