'use client';

interface Bar {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  bars: Bar[];
  height?: number;
  showValues?: boolean;
  maxValue?: number;
}

export function MiniBarChart({ bars, height = 64, showValues = false, maxValue }: MiniBarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {bars.map((b, i) => {
        const pct = Math.max((b.value / max) * 100, 3);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5 h-full justify-end">
            {showValues && b.value > 0 && (
              <span className="text-[8px] font-semibold text-neutral-500">{b.value}</span>
            )}
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${pct}%`,
                background: b.color ?? '#8b8881',
                opacity: 0.82,
                minHeight: '3px',
              }}
            />
            <span className="text-[8px] text-neutral-400 truncate w-full text-center leading-tight">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
