'use client';

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
  id?: string;
}

export function SparkLine({
  data,
  color = '#8b8881',
  height = 36,
  showArea = true,
  id = 'sl',
}: SparkLineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const pad = 3;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x: +x.toFixed(1), y: +y.toFixed(1) };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `0,${h} ${polyline} ${w},${h}`;
  const gradId = `spark-${id}-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ height, width: '100%' }}
      preserveAspectRatio="none"
    >
      {showArea && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
      )}
      {showArea && (
        <polygon fill={`url(#${gradId})`} points={area} />
      )}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        points={polyline}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dot on last point */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}
