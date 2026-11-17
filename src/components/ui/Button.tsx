import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/cn';

import { Icon } from './Icon';

type Variant = 'primary' | 'tonal' | 'surface' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconSize?: number;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:brightness-105 active:brightness-95',
  tonal: 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim',
  surface:
    'bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container active:bg-surface-container',
  ghost: 'text-secondary hover:text-on-surface hover:bg-surface-container',
  outline: 'border border-outline-variant text-on-surface hover:bg-surface-container',
  danger: 'bg-error-container text-on-error-container hover:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-full',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-full',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconSize = 18,
  fullWidth,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize} fill={variant === 'primary'} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  iconSize = 20,
  className,
  active,
  ...props
}: Omit<ButtonProps, 'children' | 'icon' | 'size'> & {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-all hover:bg-surface-container hover:text-on-surface active:scale-95',
        active && 'bg-surface-container text-primary',
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={iconSize} fill={active} />
    </button>
  );
}
