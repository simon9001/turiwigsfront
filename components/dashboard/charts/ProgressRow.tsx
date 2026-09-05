'use client';

interface ProgressRowProps {
  label: string;
  value: number;
  max: number;
  displayValue?: string;
  color?: string;
  subLabel?: string;
  className?: string;
}

export function ProgressRow({
  label,
  value,
  max,
  displayValue,
  color = '#8b8881',
  subLabel,
  className,
}: ProgressRowProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-neutral-700 truncate">{label}</span>
        <span className="text-xs font-semibold text-neutral-800 ml-2 flex-shrink-0">
          {displayValue ?? value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {subLabel && (
        <p className="mt-0.5 text-[10px] text-neutral-400">{subLabel}</p>
      )}
    </div>
  );
}
