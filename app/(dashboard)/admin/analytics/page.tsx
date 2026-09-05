'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { analyticsApi } from '@/api/analytics.api';
import type { RevenueData, PLData, StaffPerformanceItem, BookingAnalytics } from '@/api/analytics.api';
import { SparkLine } from '@/components/dashboard/charts/SparkLine';
import { MiniBarChart } from '@/components/dashboard/charts/MiniBarChart';
import { DonutChart } from '@/components/dashboard/charts/DonutChart';
import { ProgressRow } from '@/components/dashboard/charts/ProgressRow';
import { formatPrice } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const GOLD = '#8b8881'; const GREEN = '#10b981'; const RED = '#ef4444';
const BLUE = '#3b82f6'; const ORANGE = '#f97316'; const PURPLE = '#8b5cf6';

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-neutral-100 shadow-sm', className)}>
      <div className="px-5 py-3.5 border-b border-neutral-50">
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [pl, setPL] = useState<PLData | null>(null);
  const [staff, setStaff] = useState<StaffPerformanceItem[]>([]);
  const [bookings, setBookings] = useState<BookingAnalytics | null>(null);

  const load = useCallback(() => {
    const bPeriod = period === '1y' ? '90d' : (period as '7d' | '30d' | '90d');
    return Promise.allSettled([
      analyticsApi.getRevenue(period),
      analyticsApi.getPL(period === '7d' ? '1m' : period === '30d' ? '3m' : '6m'),
      analyticsApi.getStaffPerformance(),
      analyticsApi.getBookings(bPeriod),
    ]).then(([r, p, s, b]) => {
      if (r.status === 'fulfilled') setRevenue(r.value.data.data);
      if (p.status === 'fulfilled') setPL(p.value.data.data);
      if (s.status === 'fulfilled') setStaff(s.value.data.data as StaffPerformanceItem[]);
      if (b.status === 'fulfilled') setBookings(b.value.data.data);
    });
  }, [period]);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['orders', 'service_bookings'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const sparkRevenue = revenue?.daily?.map((d) => d.revenue) ?? [];
  const dayBars = (revenue?.daily ?? []).slice(-14).map((d) => ({
    label: new Date(d.day).toLocaleDateString('en', { weekday: 'short' }),
    value: d.revenue,
    color: GOLD,
  }));

  const bStatus = bookings?.byStatus ?? {};
  const bTotal  = bookings?.total ?? 0;
  const donut = [
    { label: 'Completed',  value: bStatus.completed  ?? 0, color: GREEN  },
    { label: 'Confirmed',  value: bStatus.confirmed  ?? 0, color: BLUE   },
    { label: 'Pending',    value: bStatus.pending    ?? 0, color: ORANGE },
    { label: 'Cancelled',  value: bStatus.cancelled  ?? 0, color: RED    },
    { label: 'No-show',    value: bStatus.no_show    ?? 0, color: '#c9c6bf' },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Analytics & Reports</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Business intelligence for Tiuri</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('rounded-xl px-3 py-1.5 text-xs font-semibold transition-all', period === p ? 'text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50')}
              style={period === p ? { background: GOLD } : {}}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatPrice(revenue?.total ?? 0), icon: DollarSign, color: GOLD, spark: sparkRevenue },
          { label: 'Orders',        value: revenue?.orderCount ?? 0,          icon: TrendingUp, color: BLUE },
          { label: 'Avg Order',     value: formatPrice(revenue?.avgOrderValue ?? 0), icon: TrendingUp, color: GREEN },
          { label: 'Bookings',      value: bTotal, icon: Calendar, color: PURPLE },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{k.label}</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{k.value}</p>
              </div>
              <div className="rounded-xl p-2.5" style={{ background: `${k.color}15` }}>
                <k.icon className="h-4 w-4" style={{ color: k.color }} />
              </div>
            </div>
            {k.spark && k.spark.length > 1 && (
              <div className="h-8"><SparkLine data={k.spark} color={k.color} id={k.label} /></div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue bars + Booking donut */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card title="Revenue Trend" className="lg:col-span-7">
          {dayBars.length > 0
            ? <><MiniBarChart bars={dayBars} height={80} showValues /><div className="mt-3 pt-3 border-t border-neutral-50 flex justify-between text-xs text-neutral-500"><span>Total: <strong className="text-neutral-800">{formatPrice(revenue?.total ?? 0)}</strong></span><span>Orders: <strong className="text-neutral-800">{revenue?.orderCount}</strong></span></div></>
            : <p className="text-sm text-neutral-400 text-center py-8">No revenue data</p>}
        </Card>
        <Card title="Booking Breakdown" className="lg:col-span-5">
          {donut.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart segments={donut} size={110} thickness={13}
                center={<div className="text-center"><p className="text-xl font-bold text-neutral-900">{bTotal}</p><p className="text-[10px] text-neutral-400">total</p></div>} />
              <div className="w-full space-y-1.5">
                {donut.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-neutral-600">{s.label}</span>
                    </div>
                    <span className="font-semibold text-neutral-800">{s.value} ({bTotal ? ((s.value / bTotal) * 100).toFixed(0) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-neutral-400 text-center py-8">No booking data</p>}
        </Card>
      </div>

      {/* P&L */}
      {pl && (
        <Card title={`P&L — ${pl.period}`}>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { l: 'Revenue',   v: pl.totalRevenue,   c: GREEN  },
              { l: 'Expenses',  v: pl.totalExpenses,  c: RED    },
              { l: 'Net Profit',v: pl.netProfit,       c: pl.netProfit >= 0 ? BLUE : RED },
            ].map((m) => (
              <div key={m.l} className="rounded-xl p-4 text-center" style={{ background: `${m.c}0d` }}>
                <p className="text-[10px] font-medium text-neutral-500">{m.l}</p>
                <p className="text-lg font-bold mt-1" style={{ color: m.c }}>{formatPrice(m.v)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {(pl.monthly ?? []).slice(0, 6).map((m) => (
              <ProgressRow key={m.month}
                label={new Date(m.month).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                value={Number(m.total_revenue)}
                max={Math.max(pl.totalRevenue, 1)}
                displayValue={`${formatPrice(Number(m.net_profit))} net`}
                color={Number(m.net_profit) >= 0 ? GREEN : RED} />
            ))}
          </div>
        </Card>
      )}

      {/* Staff performance */}
      {staff.length > 0 && (
        <Card title="Staff Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                  {['Staff', 'Completed', 'No-shows', 'Revenue', 'Pending Comm.', 'Rate'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const tot = (s.completed + s.no_shows + s.cancellations) || 1;
                  const rate = Math.round((s.completed / tot) * 100);
                  return (
                    <tr key={s.staff_id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{s.staff_name}</td>
                      <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${GREEN}18`, color: GREEN }}>{s.completed}</span></td>
                      <td className="px-4 py-3 text-neutral-500">{s.no_shows}</td>
                      <td className="px-4 py-3 font-semibold text-neutral-800">{formatPrice(s.revenue_generated || 0)}</td>
                      <td className="px-4 py-3" style={{ color: ORANGE }}>{formatPrice(s.pending_commission || 0)}</td>
                      <td className="px-4 py-3 w-28">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-neutral-100"><div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 80 ? GREEN : rate >= 60 ? ORANGE : RED }} /></div>
                          <span className="text-[10px] text-neutral-500">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
