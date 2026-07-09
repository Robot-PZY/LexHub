import type { ReactNode } from 'react';

type StatusValue = 'waiting' | 'running' | 'success' | 'warning' | 'danger' | 'failed' | 'archived';
type StatusShape = 'dot' | 'pill' | 'inline';

type StatusProps = {
  status?: StatusValue;
  shape?: StatusShape;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
};

function Status({
  status = 'waiting',
  shape = 'pill',
  size = 'sm',
  children,
  className = '',
}: StatusProps) {
  const classes = [
    'lex-status',
    `lex-status-${status}`,
    `lex-status-${size}`,
    shape === 'pill' ? 'lex-status-pill' : '',
    shape === 'inline' ? 'lex-status-inline' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {shape !== 'inline' && <span className="lex-status-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Status;

