'use client';

interface Segment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}

export function DonutChart({
  segments,
  size = 100,
  thickness = 12,
  center,
}: DonutChartProps) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - thickness / 2 - 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  // Each arc's start is the sum of everything before it. Deriving that per
  // segment keeps this a pure projection — no running total to mutate.
  // Segment counts here are single digits, so the repeated sum is free.
  const arcs = segments.map((seg, i) => {
    const pct = seg.value / total;
    const startPct = segments.slice(0, i).reduce((a, b) => a + b.value, 0) / total;
    return {
      color: seg.color,
      dash: pct * circ,
      gap: circ - pct * circ,
      offset: circ - startPct * circ,
    };
  });

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#e9e8e4"
          strokeWidth={thickness}
        />
        {/* Segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={`${arc.dash.toFixed(2)} ${arc.gap.toFixed(2)}`}
            strokeDashoffset={arc.offset.toFixed(2)}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {center && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {center}
        </div>
      )}
    </div>
  );
}
