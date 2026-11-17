import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/cn';

import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, subtitle, icon, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface-container-lowest shadow-float animate-slide-up sm:max-w-lg sm:animate-pop-in sm:rounded-3xl',
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-outline-variant sm:hidden" />
        <header className="flex items-start gap-3 px-5 pb-3 pt-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon name={icon} size={21} />
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="font-headline-md text-[17px] font-semibold text-on-surface">{title}</h2>
            {subtitle && <p className="mt-0.5 font-caption text-caption text-secondary">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container active:scale-95"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <footer className="border-t border-outline-variant/30 px-5 pb-safe pt-3">
            <div className="flex items-center justify-end gap-2 pb-1">{footer}</div>
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}
