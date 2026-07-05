type BrandLogoProps = {
  subtitle?: string;
  compact?: boolean;
  className?: string;
  markOnly?: boolean;
  variant?: 'hub' | 'axis' | 'seal' | 'path';
};

function BrandLogo({
  subtitle = 'Legal Intelligence',
  compact = false,
  className = '',
  markOnly = false,
}: BrandLogoProps) {
  return (
    <div className={`brand-logo-react ${compact ? 'compact' : ''} ${markOnly ? 'mark-only' : ''} ${className}`.trim()}>
      <div className="brand-logo-mark-react" aria-hidden="true">
        <img src="/brand/lexhub-ui-mark.png" alt="" />
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
