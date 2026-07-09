import { FolderOpen } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import type { RecentRecordItem } from '../../types/replay';

type RecentReplayPanelProps = {
  items: RecentRecordItem[];
  onViewAll: () => void;
};

function RecentReplayPanel({ items }: RecentReplayPanelProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen size={22} />}
        title="暂无近期记录"
        description="完成一次事项办理后，最近的记录会显示在这里，方便继续查看或恢复处理。"
      />
    );
  }

  return (
    <div className="records-list-react">
      {items.map((item) => (
        <article key={`${item.title}-${item.time}`} className="record-card-react">
          <FolderOpen size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <div className="record-card-copy-react">
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </div>
          <time style={{ color: 'var(--color-muted)', fontSize: 12, flexShrink: 0 }}>{item.time}</time>
        </article>
      ))}
    </div>
  );
}

export default RecentReplayPanel;
