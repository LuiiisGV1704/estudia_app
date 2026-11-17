import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

import { PageHeader } from './PageHeader';

interface StackPageProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  close?: boolean;
  backTo?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function StackPage({
  title,
  subtitle,
  right,
  close,
  backTo,
  children,
  className,
  contentClassName,
}: StackPageProps) {
  return (
    <div className={cn('min-h-dvh bg-surface', className)}>
      <PageHeader title={title} subtitle={subtitle} right={right} close={close} backTo={backTo} />
      <main
        className={cn('mx-auto w-full max-w-[560px] px-margin', contentClassName)}
        style={{
          paddingTop: 'calc(4.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
    </div>
  );
}
