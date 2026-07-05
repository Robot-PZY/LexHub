import type { LucideIcon } from 'lucide-react';

type PageHeaderProps = {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
};

function PageHeader({ icon: Icon, title, subtitle, badge, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {Icon && (
          <div className="page-header-icon">
            <Icon size={18} />
          </div>
        )}
        <div>
          <div className="page-header-title-row">
            <h1>{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}

export default PageHeader;
