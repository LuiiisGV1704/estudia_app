import { cn } from '../../lib/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
  trackClassName?: string;
  color?: string;
  height?: string;
}

export function ProgressBar({ value, className, trackClassName, color, height = 'h-1' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-primary-fixed', height, trackClassName, className)}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
