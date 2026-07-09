import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonVariant = 'plain' | 'soft' | 'bordered' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: ReactNode;
};

function IconButton({
  label,
  variant = 'plain',
  size = 'md',
  icon,
  className = '',
  ...props
}: IconButtonProps) {
  const classes = [
    'lex-icon-button',
    `lex-icon-button-${variant}`,
    `lex-icon-button-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} aria-label={label} title={label} {...props}>
      {icon}
    </button>
  );
}

export default IconButton;

