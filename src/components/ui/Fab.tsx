import { cn } from '../../lib/cn';

import { Icon } from './Icon';

interface FabProps {
  onClick: () => void;
  label: string;
  icon?: string;
  className?: string;
  offset?: 'tab' | 'stack';
}

export function Fab({ onClick, label, icon = 'add', className, offset = 'tab' }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        bottom:
          offset === 'tab'
            ? 'calc(130px + env(safe-area-inset-bottom, 0px))'
            : 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
      className={cn(
        'fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-primary-float transition-all hover:brightness-105 active:scale-90',
        className,
      )}
    >
      <Icon name={icon} size={28} />
    </button>
  );
}
