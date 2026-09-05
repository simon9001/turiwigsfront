'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { staffDashboardApi } from '@/api/staff-dashboard.api';
import type { CommissionSummaryOwn } from '@/api/staff-dashboard.api';
import { ProgressRow } from '@/components/dashboard/charts/ProgressRow';
import { formatPrice, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const GREEN = '#10b981'; const GOLD = '#8b8881'; const ORANGE = '#f97316'; type Earning = { id: string; service_amount: number; commission_pct: number; commission_amount: number; status: string; created_at: string; service_bookings?: { booking_number: string; scheduled_date: string; services?: { name: string } | null }[] | null };

export default function StaffCommissionsPage() {
  const [summary, setSummary]     = useState<CommissionSummaryOwn | null>(null);
  const [earnings, setEarnings]   = useState<Earning[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState<'all' | 'pending' | 'paid'>('all');

  const load = useCallback(() => {
    const params = statusFilter !== 'all' ? { status: statusFilter } : {};
    return Promise.allSettled([
      staffDashboardApi.getCommissionSummary(),
      staffDashboardApi.getOwnCommissions(params),
    ]).then(([s, e]) => {
      if (s.status === 'fulfilled') setSummary(s.value.data.data);
      if (e.status === 'fulfilled') setEarnings((e.value.data.data ?? []) as Earning[]);
      setLoading(false);
    });
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['commissions', 'service_bookings'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">My Commissions</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Your earnings from completed services</p>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',   value: summary.pending, color: ORANGE },
            { label: 'Paid',      value: summary.paid,    color: GREEN  },
            { label: 'Total',     value: summary.total,   color: GOLD   },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 text-center">
              <div className="rounded-xl p-2 inline-flex mb-2" style={{ background: `${k.color}15` }}>
                <DollarSign className="h-4 w-4" style={{ color: k.color }} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{k.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: k.color }}>{formatPrice(k.value)}</p>
            </div>
          ))}
        </div>
      )}

      {summary && summary.total > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <ProgressRow label="Paid out" value={summary.paid} max={summary.total}
            displayValue={`${Math.round((summary.paid / summary.total) * 100)}%`} color={GREEN} />
        </div>
      )}

      {/* Filter + table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-neutral-800">Commission History</h3>
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
            {(['all', 'pending', 'paid'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize',
                  statusFilter === s ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500')}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                {['Booking', 'Service', 'Date', 'Service Amt', 'Rate', 'Commission', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
              ) : earnings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No commissions yet. Complete bookings to earn commissions.</td></tr>
              ) : earnings.map((e) => {
                const bk = Array.isArray(e.service_bookings) ? e.service_bookings[0] : null;
                const svcName = bk?.services?.name ?? '—';
                return (
                  <tr key={e.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-600">{bk?.booking_number ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">{svcName}</td>
                    <td className="px-4 py-3 text-neutral-500">{bk?.scheduled_date ? formatDate(bk.scheduled_date) : formatDate(e.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-700">{formatPrice(Number(e.service_amount))}</td>
                    <td className="px-4 py-3 text-neutral-500">{Number(e.commission_pct)}%</td>
                    <td className="px-4 py-3 font-bold" style={{ color: GOLD }}>{formatPrice(Number(e.commission_amount))}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                        style={e.status === 'paid' ? { background: `${GREEN}15`, color: GREEN } : { background: `${ORANGE}15`, color: ORANGE }}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
