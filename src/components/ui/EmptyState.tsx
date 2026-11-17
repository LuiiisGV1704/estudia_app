import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

import { Icon } from './Icon';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl bg-surface-container-low px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="font-headline-md text-[16px] font-medium text-on-surface">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[280px] font-caption text-caption leading-relaxed text-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
