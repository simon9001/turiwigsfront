import type { ElementType } from 'react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  sub?: string;
  /** Renders on a dark card to highlight key metrics (e.g. revenue). */
  highlight?: boolean;
}

export function StatCard({ label, value, icon: Icon, sub, highlight }: StatCardProps) {
  return (
    <div
      className={cn('rounded-2xl border p-5', highlight ? 'border-ink' : 'border-line bg-paper')}
      style={highlight ? { background: '#171614' } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-xs font-semibold uppercase tracking-wider', highlight ? 'text-white/60' : 'text-mute')}>
            {label}
          </p>
          <p className={cn('mt-1.5 text-2xl font-bold truncate', highlight ? 'text-white' : 'text-ink')}>
            {value}
          </p>
          {sub && (
            <p className={cn('mt-1 text-xs', highlight ? 'text-white/45' : 'text-mute')}>
              {sub}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 rounded-xl p-2.5"
          style={{ background: highlight ? 'rgba(255,255,255,0.12)' : 'rgba(23,22,20,0.06)' }}>
          <Icon className="h-5 w-5" style={{ color: highlight ? '#ffffff' : '#55534e' }} />
        </div>
      </div>
    </div>
  );
}
