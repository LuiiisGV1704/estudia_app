import type { CSSProperties } from 'react';

import { cn } from '../../lib/cn';

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 22, fill = false, className, style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-outlined shrink-0 leading-none', fill && 'icon-fill', className)}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}
