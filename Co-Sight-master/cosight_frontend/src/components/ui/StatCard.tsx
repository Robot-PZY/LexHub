type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
};

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="ds-stat ds-card">
      <span className="ds-stat-label">{label}</span>
      <div className="ds-stat-value">{value}</div>
      {description && <div className="ds-stat-desc">{description}</div>}
    </article>
  );
}

export default StatCard;
