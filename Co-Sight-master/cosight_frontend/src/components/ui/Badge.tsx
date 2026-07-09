import type { ReactNode } from 'react';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  tone?: BadgeTone;
  size?: BadgeSize;
  pill?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

function Badge({
  tone = 'neutral',
  size = 'sm',
  pill = false,
  icon,
  children,
  className = '',
}: BadgeProps) {
  const classes = [
    'lex-badge',
    `lex-tone-${tone}`,
    `lex-badge-${size}`,
    pill ? 'lex-badge-pill' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {icon}
      {children}
    </span>
  );
}

export default Badge;

