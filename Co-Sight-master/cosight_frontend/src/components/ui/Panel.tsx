import type { HTMLAttributes, ReactNode } from 'react';

type PanelSurface = 'default' | 'muted' | 'strong';
type PanelDensity = 'compact' | 'normal' | 'spacious';

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'article' | 'aside' | 'div';
  title?: ReactNode;
  actions?: ReactNode;
  surface?: PanelSurface;
  density?: PanelDensity;
  accent?: boolean;
  children: ReactNode;
};

function Panel({
  as: Component = 'section',
  title,
  actions,
  surface = 'default',
  density = 'normal',
  accent = false,
  className = '',
  children,
  ...props
}: PanelProps) {
  const classes = [
    'lex-panel',
    `lex-panel-${surface}`,
    `lex-panel-${density}`,
    accent ? 'lex-panel-accent' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {(title || actions) && (
        <div className="lex-panel-header">
          {title && <h2 className="lex-panel-title">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </Component>
  );
}

export default Panel;

