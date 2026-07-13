type BrandLogoProps = {
  subtitle?: string;
  compact?: boolean;
  className?: string;
  markOnly?: boolean;
  variant?: 'hub' | 'axis' | 'seal' | 'path' | 'editorial';
};

function BrandLogo({
  subtitle = 'Legal Intelligence',
  compact = false,
  className = '',
  markOnly = false,
  variant,
}: BrandLogoProps) {
  const isEditorial = variant === 'editorial';

  return (
    <div className={`brand-logo-react ${compact ? 'compact' : ''} ${markOnly ? 'mark-only' : ''} ${isEditorial ? 'editorial' : ''} ${className}`.trim()}>
      <div className="brand-logo-mark-react" aria-hidden="true">
        {isEditorial ? (
          <svg className="brand-logo-v2-svg" viewBox="0 0 96 96" role="img" aria-label="LexHub">
            <rect className="brand-logo-v2-frame" x="18" y="18" width="60" height="60" rx="18" />
            <path className="brand-logo-v2-path" d="M48 24v48M24 48h48" />
            <path className="brand-logo-v2-route" d="M31 31h16c10 0 18 8 18 18v16" />
            <path className="brand-logo-v2-route" d="M65 31H49c-10 0-18 8-18 18v16" />
            <circle className="brand-logo-v2-node" cx="48" cy="48" r="7" />
          </svg>
        ) : (
          <img src="/brand/lexhub-ui-mark.png" alt="" />
        )}
      </div>
      {!markOnly && (
        <div className="brand-logo-copy-react">
          <strong>律枢</strong>
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
