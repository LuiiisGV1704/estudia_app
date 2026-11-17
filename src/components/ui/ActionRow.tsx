import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

import { Icon } from './Icon';

interface ActionRowProps {
  icon: string;
  title: string;
  description?: string;
  value?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  iconColor?: string;
  iconBackground?: string;
  className?: string;
}

export function ActionRow({
  icon,
  title,
  description,
  value,
  trailing,
  onClick,
  danger,
  iconColor,
  iconBackground,
  className,
}: ActionRowProps) {
  const body = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: iconBackground ?? 'rgb(var(--c-surface-container))',
          color: iconColor ?? 'rgb(var(--c-on-surface-variant))',
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            'block truncate font-body-md text-[14px] font-medium',
            danger ? 'text-error' : 'text-on-surface',
          )}
        >
          {title}
        </span>
        {description && (
          <span className="mt-0.5 block truncate font-caption text-[11px] text-secondary">{description}</span>
        )}
      </span>
      {value && <span className="shrink-0 font-label-md text-[12px] text-secondary">{value}</span>}
      {trailing ?? (onClick ? <Icon name="chevron_right" size={18} className="shrink-0 text-secondary" /> : null)}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-container active:scale-[0.995]',
          className,
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5', className)}>{body}</div>;
}
