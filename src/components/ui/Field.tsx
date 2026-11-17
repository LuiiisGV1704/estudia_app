import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

export const inputClass =
  'w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2.5 font-body-md text-[15px] text-on-surface outline-none transition-colors placeholder:text-secondary/60 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/15';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="font-label-md text-[12px] font-medium text-on-surface-variant">{label}</span>
      {children}
      {hint && <span className="font-caption text-[11px] text-secondary">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, 'min-h-[96px] resize-none', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, 'appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export function ColorSwatches({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          aria-pressed={value.toLowerCase() === color.toLowerCase()}
          onClick={() => onChange(color)}
          className={cn(
            'h-8 w-8 rounded-full transition-transform active:scale-90',
            value.toLowerCase() === color.toLowerCase() &&
              'scale-110 ring-2 ring-on-surface/70 ring-offset-2 ring-offset-surface-container-lowest',
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
