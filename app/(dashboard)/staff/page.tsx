'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Calendar, CheckCircle, Clock, DollarSign,
  AlertCircle, Loader2,
  UserCheck, Coffee, Zap, Star,
} from 'lucide-react';
import { staffDashboardApi } from '@/api/staff-dashboard.api';
import type { ScheduleEntry, CommissionSummaryOwn, OwnPerformance, OwnStaffProfile } from '@/api/staff-dashboard.api';
import { hrApi } from '@/api/hr.api';
import type { AttendanceRecord } from '@/api/hr.api';
import { ProgressRow } from '@/components/dashboard/charts/ProgressRow';
import { formatPrice } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const GOLD   = '#8b8881';
const DARK   = '#171614';
const GREEN  = '#10b981';
const RED    = '#ef4444';
const BLUE   = '#3b82f6';
const ORANGE = '#f97316';
const PURPLE = '#8b5cf6';

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  pending:    { color: ORANGE,    label: 'Pending',     bg: `${ORANGE}18` },
  confirmed:  { color: BLUE,      label: 'Confirmed',   bg: `${BLUE}18` },
  in_progress:{ color: PURPLE,    label: 'In Progress', bg: `${PURPLE}18` },
  completed:  { color: GREEN,     label: 'Completed',   bg: `${GREEN}18` },
  cancelled:  { color: RED,       label: 'Cancelled',   bg: `${RED}18` },
  no_show:    { color: '#8b8881', label: 'No-show',     bg: '#e9e8e4' },
};

// ─── Skeuomorphic tokens ──────────────────────────────────────────────────────

const CARD_LIGHT: React.CSSProperties = {
  background: 'linear-gradient(160deg, #ffffff 0%, #f4f4f2 100%)',
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,0.92)',
    'inset 0 -1px 0 rgba(0,0,0,0.04)',
    '0 1px 2px rgba(0,0,0,0.08)',
    '0 4px 10px rgba(0,0,0,0.05)',
    '0 14px 28px rgba(0,0,0,0.03)',
  ].join(', '),
  border: '1px solid rgba(0,0,0,0.07)',
};

const CARD_DARK: React.CSSProperties = {
  background: [
    'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)',
    '#171614',
  ].join(', '),
  boxShadow: [
    'inset 0 1px 0 rgba(255,255,255,0.07)',
    'inset 0 -1px 0 rgba(0,0,0,0.4)',
    '0 4px 14px rgba(0,0,0,0.25)',
    '0 16px 40px rgba(0,0,0,0.14)',
  ].join(', '),
  border: '1px solid rgba(23,22,20,0.18)',
};

const SECTION_HEADER: React.CSSProperties = {
  background: 'linear-gradient(180deg, #f4f4f2 0%, #e9e8e4 100%)',
  borderBottom: '1px solid rgba(0,0,0,0.07)',
  boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.45)',
};

const statusBadge = (color: string): React.CSSProperties => ({
  background: `${color}14`,
  color,
  boxShadow: `inset 0 1px 2px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.55)`,
  border: `1px solid ${color}28`,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize flex-shrink-0"
      style={statusBadge(cfg.color)}>
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function StatusButton({ status, onClick, disabled }: {
  status: 'in_progress' | 'completed' | 'no_show';
  onClick: () => void;
  disabled: boolean;
}) {
  const cfgs: Record<string, { label: string; color: string }> = {
    in_progress: { label: 'Start',    color: PURPLE },
    completed:   { label: 'Complete', color: GREEN  },
    no_show:     { label: 'No-show',  color: RED    },
  };
  const cfg = cfgs[status];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all disabled:opacity-40 active:scale-95"
      style={{
        background: `${cfg.color}12`,
        color: cfg.color,
        boxShadow: `inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.55)`,
        border: `1px solid ${cfg.color}30`,
      }}
    >
      {cfg.label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffOverviewPage() {
  const [schedule, setSchedule]       = useState<ScheduleEntry[]>([]);
  const [commissions, setCommissions] = useState<CommissionSummaryOwn | null>(null);
  const [performance, setPerformance] = useState<OwnPerformance | null>(null);
  const [profile, setProfile]         = useState<OwnStaffProfile | null>(null);
  const [attendance, setAttendance]   = useState<AttendanceRecord | null>(null);
  const [loading, setLoading]         = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [clockOutNote, setClockOutNote] = useState('');
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [now, setNow]                 = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(() => {
    return Promise.allSettled([
      staffDashboardApi.getSchedule({ date: today }),
      staffDashboardApi.getCommissionSummary(),
      staffDashboardApi.getOwnPerformance(),
      staffDashboardApi.getOwnProfile(),
      hrApi.getMyAttendance({ startDate: today, endDate: today, limit: 1 }),
    ]).then((results) => {
      if (results[0].status === 'fulfilled') setSchedule(results[0].value.data.data as ScheduleEntry[]);
      if (results[1].status === 'fulfilled') setCommissions(results[1].value.data.data);
      if (results[2].status === 'fulfilled') setPerformance(results[2].value.data.data);
      if (results[3].status === 'fulfilled') setProfile(results[3].value.data.data);
      if (results[4].status === 'fulfilled') {
        const records = results[4].value.data.data as AttendanceRecord[];
        setAttendance(records[0] ?? null);
      }
      setLoading(false);
    });
  }, [today]);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['service_bookings', 'attendance_records', 'commission_earnings'], load);

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const res = await hrApi.clockIn();
      setAttendance(res.data.data);
      toast.success('Clocked in successfully!');
    } catch {
      toast.error('Clock-in failed');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = () => {
    setClockOutNote('');
    setShowClockOutModal(true);
  };

  const submitClockOut = async (note?: string) => {
    setClockLoading(true);
    setShowClockOutModal(false);
    try {
      const res = await hrApi.clockOut(note);
      setAttendance(res.data.data);
      toast.success('Clocked out. Have a great day!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Clock-out failed';
      toast.error(msg);
      if (msg.includes('reason')) setShowClockOutModal(true);
    } finally {
      setClockLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: 'in_progress' | 'completed' | 'no_show') => {
    setUpdatingId(bookingId);
    try {
      await staffDashboardApi.updateBookingStatus(bookingId, status);
      setSchedule((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
      toast.success(`Booking marked as ${status.replace('_', ' ')}`);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const todayBookings  = schedule.filter((b) => !['cancelled'].includes(b.status));
  const completed      = schedule.filter((b) => b.status === 'completed').length;
  const inProgress     = schedule.find((b) => b.status === 'in_progress');
  const upcoming       = schedule.filter((b) => ['pending', 'confirmed'].includes(b.status));
  const completionRate = todayBookings.length
    ? Math.round((completed / todayBookings.length) * 100)
    : 0;

  const isClockedIn  = !!attendance?.clock_in && !attendance?.clock_out;
  const isClockedOut = !!attendance?.clock_in && !!attendance?.clock_out;

  const clockInTime = attendance?.clock_in
    ? new Date(attendance.clock_in).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    : null;

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dayName = now.toLocaleDateString('en-KE', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-KE', { day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(23,22,20,0.18) 0%, rgba(23,22,20,0.05) 100%)',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.12)',
                border: '1px solid rgba(23,22,20,0.2)',
              }} />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin" style={{ color: GOLD }} />
          </div>
          <p className="text-sm font-medium" style={{ color: '#8b8881' }}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">

      {/* ── Clock-out modal ───────────────────────────────────────────────── */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm p-6 space-y-4 rounded-2xl"
            style={CARD_LIGHT}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${ORANGE}14`,
                  boxShadow: `inset 0 1px 3px rgba(0,0,0,0.1)`,
                  border: `1px solid ${ORANGE}25`,
                }}>
                <Coffee className="h-5 w-5" style={{ color: ORANGE }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#171614' }}>Clock Out</p>
                <p className="text-xs mt-0.5" style={{ color: '#8b8881' }}>
                  Leaving before closing time? A note is required.
                </p>
              </div>
            </div>
            <textarea
              rows={3}
              value={clockOutNote}
              onChange={(e) => setClockOutNote(e.target.value)}
              placeholder="Reason for early departure (required if before closing time)…"
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
              style={{
                background: '#f4f4f2',
                border: '1px solid #dedcd7',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.10)',
                color: '#171614',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowClockOutModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-98"
                style={{ ...CARD_LIGHT, color: '#55534e' }}>
                Cancel
              </button>
              <button
                onClick={() => submitClockOut(clockOutNote || undefined)}
                disabled={clockLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-98"
                style={{
                  background: `linear-gradient(180deg, #f87171 0%, ${RED} 50%, #dc2626 100%)`,
                  boxShadow: [
                    '0 4px 10px rgba(239,68,68,0.3)',
                    'inset 0 1px 0 rgba(255,255,255,0.2)',
                    'inset 0 -2px 0 rgba(0,0,0,0.15)',
                  ].join(', '),
                  border: '1px solid rgba(0,0,0,0.12)',
                }}>
                {clockLoading ? 'Clocking out…' : 'Confirm Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero header — embossed leather card ──────────────────────────── */}
      <div className="rounded-2xl p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={CARD_DARK}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: `${GOLD}70`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {dayName} · {dateStr}
          </p>
          <h1 className="mt-1 text-xl font-bold"
            style={{ color: '#e9e8e4', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {greeting()}, {profile?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>
            {timeStr} · {todayBookings.length} appointment{todayBookings.length !== 1 ? 's' : ''} today
          </p>
        </div>

        {/* Clock in/out — tactile physical button */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          {isClockedIn && (
            <p className="flex items-center gap-1 text-xs"
              style={{ color: `${GREEN}cc`, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              <CheckCircle className="h-3 w-3" />
              Clocked in at {clockInTime}
            </p>
          )}
          {isClockedOut && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Shift complete · in at {clockInTime}
            </p>
          )}
          {!attendance && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Not clocked in yet</p>
          )}
          <button
            onClick={isClockedIn ? handleClockOut : handleClockIn}
            disabled={clockLoading || isClockedOut}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40 active:scale-95 active:translate-y-0.5"
            style={isClockedIn
              ? {
                  background: `linear-gradient(180deg, #f87171 0%, ${RED} 50%, #dc2626 100%)`,
                  boxShadow: [
                    '0 6px 14px rgba(239,68,68,0.35)',
                    '0 3px 6px rgba(0,0,0,0.2)',
                    'inset 0 1px 0 rgba(255,255,255,0.22)',
                    'inset 0 -2px 0 rgba(0,0,0,0.18)',
                  ].join(', '),
                  border: '1px solid rgba(0,0,0,0.15)',
                  color: '#fff',
                }
              : {
                  background: `#171614`,
                  boxShadow: [
                    `0 6px 16px rgba(23,22,20,0.4)`,
                    '0 3px 6px rgba(0,0,0,0.22)',
                    'inset 0 1px 0 rgba(255,255,255,0.32)',
                    'inset 0 -2px 0 rgba(0,0,0,0.2)',
                  ].join(', '),
                  border: '1px solid rgba(0,0,0,0.15)',
                  color: DARK,
                }
            }
          >
            {clockLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : isClockedIn
                ? <><Coffee className="h-4 w-4" /> Clock Out</>
                : <><UserCheck className="h-4 w-4" /> Clock In</>}
          </button>
        </div>
      </div>

      {/* ── KPI tiles ─────────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Today's Bookings", value: todayBookings.length, icon: Calendar, color: BLUE, sub: `${upcoming.length} upcoming` },
          { label: 'Completed', value: completed, icon: CheckCircle, color: GREEN, sub: `${completionRate}% rate` },
          { label: 'Pending Commission', value: commissions ? formatPrice(commissions.pending) : '—', icon: DollarSign, color: GOLD, sub: 'Unpaid earnings' },
          { label: 'Total Earned', value: commissions ? formatPrice(commissions.total) : '—', icon: Zap, color: PURPLE, sub: 'All time' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4" style={CARD_LIGHT}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: '#8b8881', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                  {k.label}
                </p>
                <p className="mt-1 text-xl font-bold truncate"
                  style={{ color: '#171614', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>
                  {k.value}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#8b8881' }}>{k.sub}</p>
              </div>
              <div className="rounded-xl p-2.5 flex-shrink-0"
                style={{
                  background: `${k.color}14`,
                  boxShadow: `inset 0 1px 2px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.55)`,
                  border: `1px solid ${k.color}20`,
                }}>
                <k.icon className="h-4 w-4" style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── In-progress banner ────────────────────────────────────────────── */}
      {inProgress && (
        <div className="rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{
            background: `linear-gradient(135deg, ${PURPLE}0e 0%, ${PURPLE}06 100%)`,
            boxShadow: [
              `inset 0 1px 0 rgba(255,255,255,0.7)`,
              `inset 0 -1px 0 rgba(0,0,0,0.04)`,
              '0 2px 6px rgba(0,0,0,0.06)',
            ].join(', '),
            border: `1px solid ${PURPLE}28`,
          }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center animate-pulse"
              style={{
                background: `${PURPLE}22`,
                boxShadow: `inset 0 1px 3px rgba(0,0,0,0.1)`,
                border: `1px solid ${PURPLE}30`,
              }}>
              <Clock className="h-4 w-4" style={{ color: PURPLE }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: PURPLE }}>In Progress Now</p>
              <p className="text-sm font-bold" style={{ color: '#171614' }}>{inProgress.service_name}</p>
              <p className="text-[11px]" style={{ color: '#6e6b65' }}>{inProgress.customer_name} · {inProgress.scheduled_time}</p>
            </div>
          </div>
          <button
            onClick={() => handleStatusUpdate(inProgress.id, 'completed')}
            disabled={updatingId === inProgress.id}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: `linear-gradient(180deg, #34d399 0%, ${GREEN} 50%, #059669 100%)`,
              boxShadow: [
                `0 4px 10px rgba(16,185,129,0.3)`,
                'inset 0 1px 0 rgba(255,255,255,0.22)',
                'inset 0 -2px 0 rgba(0,0,0,0.15)',
              ].join(', '),
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            {updatingId === inProgress.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'Mark Complete'}
          </button>
        </div>
      )}

      {/* ── Schedule + Commission ─────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-12">

        {/* Today's schedule */}
        <div className={cn('rounded-2xl overflow-hidden lg:col-span-7')} style={CARD_LIGHT}>
          <div className="flex items-center justify-between px-5 py-3.5" style={SECTION_HEADER}>
            <h3 className="text-sm font-semibold"
              style={{ color: '#2e2c28', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
              Today&apos;s Schedule
              {todayBookings.length > 0 && (
                <span className="ml-2 text-xs font-normal" style={{ color: '#8b8881' }}>
                  {todayBookings.length} appointment{todayBookings.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <span className="text-xs" style={{ color: '#8b8881' }}>{dateStr}</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.5)' }}>
            {todayBookings.length > 0 ? todayBookings.map((b, idx) => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
              const canStart    = b.status === 'confirmed' || b.status === 'pending';
              const canComplete = b.status === 'in_progress';
              const canNoShow   = b.status === 'confirmed' || b.status === 'pending';
              return (
                <div key={b.id}
                  className="px-5 py-4 flex items-start gap-4 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: idx % 2 === 0 ? '#ffffff' : 'linear-gradient(90deg, #f4f4f2 0%, #f4f4f2 100%)',
                  }}>
                  {/* Time column */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <span className="text-xs font-bold" style={{ color: '#2e2c28' }}>{b.scheduled_time}</span>
                    <div className="w-px h-6" style={{ background: 'rgba(0,0,0,0.08)' }} />
                    <div className="h-2 w-2 rounded-full"
                      style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}60` }} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#2e2c28' }}>{b.service_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6e6b65' }}>
                          {b.customer_name}
                          {b.is_walkin && (
                            <span className="ml-1.5 text-[9px] rounded px-1 py-0.5 font-bold"
                              style={{ background: `${ORANGE}14`, color: ORANGE, border: `1px solid ${ORANGE}22` }}>
                              walk-in
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: '#8b8881' }}>
                          <span>{b.duration_minutes} min</span>
                          <span>{formatPrice(b.price)}</span>
                          {b.deposit_amount > 0 && (
                            <span>Deposit: {formatPrice(b.deposit_amount)}</span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>

                    {!['completed', 'cancelled', 'no_show'].includes(b.status) && (
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {canStart && (
                          <StatusButton status="in_progress" onClick={() => handleStatusUpdate(b.id, 'in_progress')} disabled={updatingId === b.id} />
                        )}
                        {canComplete && (
                          <StatusButton status="completed" onClick={() => handleStatusUpdate(b.id, 'completed')} disabled={updatingId === b.id} />
                        )}
                        {canNoShow && (
                          <StatusButton status="no_show" onClick={() => handleStatusUpdate(b.id, 'no_show')} disabled={updatingId === b.id} />
                        )}
                        {updatingId === b.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#8b8881' }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="px-5 py-12 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2" style={{ color: '#c9c6bf' }} />
                <p className="text-sm font-semibold" style={{ color: '#8b8881' }}>No appointments today</p>
                <p className="text-xs mt-1" style={{ color: '#c9c6bf' }}>Enjoy your free time or check for walk-ins</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-5 space-y-4">

          {/* Commission */}
          <div className="rounded-2xl overflow-hidden" style={CARD_LIGHT}>
            <div className="px-5 py-3.5" style={SECTION_HEADER}>
              <h3 className="text-sm font-semibold" style={{ color: '#2e2c28' }}>My Commission</h3>
            </div>
            <div className="p-5 space-y-4">
              {commissions ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Pending', value: commissions.pending, color: ORANGE },
                      { label: 'Paid',    value: commissions.paid,    color: GREEN  },
                      { label: 'Total',   value: commissions.total,   color: GOLD   },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl p-3"
                        style={{
                          background: `${m.color}0c`,
                          boxShadow: `inset 0 1px 3px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.6)`,
                          border: `1px solid ${m.color}18`,
                        }}>
                        <p className="text-[10px] font-semibold" style={{ color: '#6e6b65' }}>{m.label}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: m.color }}>
                          {formatPrice(m.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {commissions.total > 0 && (
                    <ProgressRow
                      label="Paid out"
                      value={commissions.paid}
                      max={commissions.total}
                      displayValue={`${Math.round((commissions.paid / commissions.total) * 100)}%`}
                      color={GREEN}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-center py-3" style={{ color: '#8b8881' }}>No commission data</p>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="rounded-2xl overflow-hidden" style={CARD_LIGHT}>
            <div className="px-5 py-3.5" style={SECTION_HEADER}>
              <h3 className="text-sm font-semibold" style={{ color: '#2e2c28' }}>My Performance</h3>
            </div>
            <div className="p-5 space-y-3">
              {performance ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center mb-1">
                    {[
                      { label: 'Completed', value: performance.completed,    color: GREEN },
                      { label: 'No-shows',  value: performance.no_shows,     color: RED   },
                      { label: 'Cancelled', value: performance.cancellations, color: '#8b8881' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl py-2.5 px-1"
                        style={{
                          background: `${m.color}0c`,
                          boxShadow: `inset 0 1px 3px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.6)`,
                          border: `1px solid ${m.color}18`,
                        }}>
                        <p className="text-[10px] font-semibold" style={{ color: '#6e6b65' }}>{m.label}</p>
                        <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  {(performance.completed + performance.no_shows + performance.cancellations) > 0 && (
                    <ProgressRow
                      label="Completion rate"
                      value={performance.completed}
                      max={performance.completed + performance.no_shows + performance.cancellations}
                      displayValue={`${Math.round((performance.completed / (performance.completed + performance.no_shows + performance.cancellations)) * 100)}%`}
                      color={GREEN}
                    />
                  )}
                  <div className="pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <p className="text-[10px] font-semibold" style={{ color: '#8b8881' }}>Revenue Generated</p>
                    <p className="text-base font-bold mt-0.5"
                      style={{ color: GOLD, textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
                      {formatPrice(performance.revenue_generated || 0)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-center py-3" style={{ color: '#8b8881' }}>No performance data yet</p>
              )}
            </div>
          </div>

          {/* Attendance today */}
          <div className="rounded-2xl p-5" style={CARD_LIGHT}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: '#8b8881', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
              Today&apos;s Attendance
            </p>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[10px] font-semibold w-16" style={{ color: '#8b8881' }}>Clock In</span>
                  <span className="font-bold" style={{ color: '#2e2c28' }}>
                    {attendance?.clock_in
                      ? new Date(attendance.clock_in).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[10px] font-semibold w-16" style={{ color: '#8b8881' }}>Clock Out</span>
                  <span className="font-bold" style={{ color: '#2e2c28' }}>
                    {attendance?.clock_out
                      ? new Date(attendance.clock_out).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: isClockedIn ? `${GREEN}14` : isClockedOut ? `${BLUE}14` : 'rgba(0,0,0,0.05)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
                  border: `1px solid ${isClockedIn ? GREEN : isClockedOut ? BLUE : 'rgba(0,0,0,0.08)'}22`,
                }}>
                {isClockedIn  && <CheckCircle className="h-6 w-6" style={{ color: GREEN }} />}
                {isClockedOut && <Star className="h-6 w-6" style={{ color: BLUE }} />}
                {!attendance  && <AlertCircle className="h-6 w-6" style={{ color: '#c9c6bf' }} />}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
