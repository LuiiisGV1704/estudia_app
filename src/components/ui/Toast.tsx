import { useApp } from '../../state/AppProvider';

import { Icon } from './Icon';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 left-1/2 z-[100] flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 animate-pop-in items-center gap-2.5 rounded-full bg-inverse-surface px-4 py-2.5 text-inverse-on-surface shadow-float"
    >
      <Icon name={toast.icon} size={18} className="text-inverse-primary" fill />
      <span className="truncate font-label-md text-[12px] font-medium">{toast.message}</span>
    </div>
  );
}
