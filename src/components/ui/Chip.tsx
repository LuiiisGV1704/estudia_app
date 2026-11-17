import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

import { Icon } from './Icon';

interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  dotColor?: string;
  icon?: string;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, selected, dotColor, icon, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 font-label-md text-label-md transition-all active:scale-95',
        selected
          ? 'bg-primary-fixed text-primary shadow-sm'
          : 'bg-surface-container text-secondary hover:bg-surface-container-high',
        className,
      )}
    >
      {dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />}
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}
