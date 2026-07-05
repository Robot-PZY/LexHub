import type { DataSource } from '../../lib/demo-fetch';

type DataSourceBadgeProps = {
  source: DataSource;
};

function DataSourceBadge({ source }: DataSourceBadgeProps) {
  return (
    <span className={`ds-badge ${source === 'api' ? 'ds-badge-success' : 'ds-badge-warning'}`}>
      {source === 'api' ? '后端数据' : '本地数据'}
    </span>
  );
}

export default DataSourceBadge;
