import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  close?: boolean;
  backTo?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, right, close, backTo, className }: PageHeaderProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <header className={cn('safe-top fixed inset-x-0 top-0 z-50 bg-surface/85 shadow-soft backdrop-blur-xl', className)}>
      <div className="mx-auto flex h-16 max-w-[560px] items-center justify-between gap-3 px-margin">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={goBack}
            aria-label="Volver"
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container active:scale-95"
          >
            <Icon name={close ? 'close' : 'arrow_back'} size={22} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-headline-md text-headline-md text-on-surface">{title}</h1>
            {subtitle && <p className="truncate font-caption text-[11px] text-secondary">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">{right}</div>
      </div>
    </header>
  );
}
