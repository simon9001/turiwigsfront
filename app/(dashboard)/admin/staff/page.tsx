'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Clock, BarChart2, Calendar, CheckCircle, XCircle,
  RefreshCw, LogIn, LogOut, AlertTriangle,
} from 'lucide-react';
import { hrAdminApi } from '@/api/erp.api';
import { analyticsApi } from '@/api/analytics.api';
import { formatPrice } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GOLD   = '#8b8881';
const DARK   = '#171614';
const GREEN  = '#10b981';
const RED    = '#ef4444';
const ORANGE = '#f97316';
const BLUE   = '#3b82f6';
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface StaffMember { staff_id: string; staff_name: string; completed: number; no_shows: number; cancellations: number; revenue_generated: number; pending_commission: number; paid_commission: number }
interface AttRec { id: string; staff_id: string; record_date: string; clock_in: string | null; clock_out: string | null; notes: string | null; profiles?: { name?: string } | null }
interface Leave  { id: string; staff_id: string; leave_type: string; start_date: string; end_date: string; reason: string | null; status: LeaveStatus; profiles?: { name?: string } | null }

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatusChip({ status, color }: { status: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize"
      style={{ background: `${color}15`, color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Performance tab ──────────────────────────────────────────────────────────
function PerformanceTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getStaffPerformance()
      .then(({ data }) => setStaff(data.data as StaffMember[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  if (staff.length === 0) return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center">
      <BarChart2 className="h-8 w-8 text-neutral-200 mx-auto mb-2" />
      <p className="text-sm text-neutral-500">No performance data yet</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-800">Staff Performance</h2>
        <span className="text-xs text-neutral-400">{staff.length} staff members</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
              {['Staff', 'Completed', 'No-shows', 'Cancellations', 'Completion %', 'Revenue', 'Commission (Pending)', 'Commission (Paid)'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => {
              const total = s.completed + s.no_shows + s.cancellations || 1;
              const rate  = Math.round((s.completed / total) * 100);
              return (
                <tr key={s.staff_id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                  style={i % 2 ? { background: '#f4f4f2' } : {}}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${GOLD}20`, color: DARK }}>
                        {s.staff_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-neutral-800">{s.staff_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${GREEN}18`, color: GREEN }}>{s.completed}</span>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500">{s.no_shows}</td>
                  <td className="px-4 py-3.5 text-neutral-400">{s.cancellations}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${rate}%`, background: rate >= 80 ? GREEN : rate >= 60 ? ORANGE : RED }} />
                      </div>
                      <span className="text-[10px] font-medium text-neutral-500">{rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-neutral-800">{formatPrice(s.revenue_generated || 0)}</td>
                  <td className="px-4 py-3.5"><span style={{ color: ORANGE }}>{formatPrice(s.pending_commission || 0)}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: GREEN }}>{formatPrice(s.paid_commission || 0)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Attendance tab ───────────────────────────────────────────────────────────
function AttendanceTab() {
  const [records, setRecords] = useState<AttRec[]>([]);
  const [loading, setLoading] = useState(true);
  // Seeded from the clock once, in a lazy initializer, so render stays pure.
  const [startDate, setStartDate] = useState(
    () => new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0]);
  const [endDate,   setEndDate]   = useState(
    () => new Date().toISOString().split('T')[0]);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const LIMIT = 20;

  const load = useCallback(() => {
    return hrAdminApi.listAttendance({ startDate, endDate, page, limit: LIMIT })
      .then(({ data }) => {
        const typed = data as unknown as { data: AttRec[]; meta: { total: number } };
        setRecords(typed.data ?? []);
        setTotal(typed.meta?.total ?? 0);
      })
      .catch(() => { toast.error('Failed to load attendance'); })
      .finally(() => setLoading(false));
  }, [startDate, endDate, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  async function handleAdminClockIn(staffId: string) {
    try {
      await hrAdminApi.adminClockIn({ staffId });
      toast.success('Clocked in'); load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed');
    }
  }

  async function handleAdminClockOut(staffId: string) {
    try {
      await hrAdminApi.adminClockOut({ staffId });
      toast.success('Clocked out'); load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed');
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-5 py-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-neutral-500 mb-1 font-medium">From</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1 font-medium">To</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
        </div>
        <p className="text-xs text-neutral-400 ml-auto">{total} records</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 flex justify-center"><Loader /></div> : (
          records.length === 0
            ? <div className="p-10 text-center text-sm text-neutral-400">No attendance records in this range.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                      {['Staff', 'Date', 'Clock In', 'Clock Out', 'Duration', 'Note', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => {
                      const inMs  = r.clock_in  ? new Date(r.clock_in).getTime()  : null;
                      const outMs = r.clock_out ? new Date(r.clock_out).getTime() : null;
                      const dur   = inMs && outMs ? Math.round((outMs - inMs) / 60000) : null;
                      const isClockedIn   = !!r.clock_in && !r.clock_out;
                      const isNotClockedIn = !r.clock_in;

                      return (
                        <tr key={r.id} className="border-b border-neutral-50 hover:bg-neutral-50"
                          style={i % 2 ? { background: '#f4f4f2' } : {}}>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ background: `${GOLD}20`, color: DARK }}>
                                {(r.profiles?.name ?? 'S')[0]?.toUpperCase()}
                              </div>
                              <span className="font-medium text-neutral-800">{r.profiles?.name ?? r.staff_id.slice(0,8)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-neutral-700">{fmtDate(r.record_date)}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono" style={{ color: r.clock_in ? GREEN : '#8b8881' }}>{fmt(r.clock_in)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono" style={{ color: r.clock_out ? BLUE : r.clock_in ? ORANGE : '#8b8881' }}>
                              {r.clock_out ? fmt(r.clock_out) : r.clock_in ? 'In Progress' : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-neutral-500">
                            {dur !== null ? `${Math.floor(dur/60)}h ${dur%60}m` : '—'}
                          </td>
                          <td className="px-4 py-3.5 max-w-[160px]">
                            {r.notes ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: `${ORANGE}10`, color: ORANGE }}>
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {r.notes.slice(0, 40)}{r.notes.length > 40 ? '…' : ''}
                              </span>
                            ) : <span className="text-neutral-300">—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {isNotClockedIn && (
                                <button onClick={() => handleAdminClockIn(r.staff_id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                                  style={{ borderColor: `${GREEN}40`, color: GREEN, background: `${GREEN}0d` }}>
                                  <LogIn className="h-3 w-3" /> Clock In
                                </button>
                              )}
                              {isClockedIn && (
                                <button onClick={() => handleAdminClockOut(r.staff_id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                                  style={{ borderColor: `${RED}40`, color: RED, background: `${RED}0d` }}>
                                  <LogOut className="h-3 w-3" /> Clock Out
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Page {page} of {Math.ceil(total / LIMIT)}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40">← Prev</button>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leaves tab ───────────────────────────────────────────────────────────────
function LeavesTab() {
  const [leaves, setLeaves]   = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<LeaveStatus | 'all'>('pending');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = filter === 'all' ? {} : { status: filter };
    return hrAdminApi.listLeaves(params)
      .then(({ data }) => setLeaves((data as { data: Leave[] }).data ?? []))
      .catch(() => { toast.error('Failed to load leaves'); })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, approved: boolean) {
    setActingId(id);
    try {
      await hrAdminApi.approveLeave(id, { approved });
      toast.success(approved ? 'Leave approved' : 'Leave rejected');
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch { toast.error('Action failed'); }
    finally  { setActingId(null); }
  }

  const LEAVE_COLOR: Record<string, string> = { pending: ORANGE, approved: GREEN, rejected: RED, cancelled: '#8b8881' };
  const LEAVE_TYPE_LABEL: Record<string, string> = { annual: 'Annual', sick: 'Sick', unpaid: 'Unpaid', maternity: 'Maternity', paternity: 'Paternity' };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-all"
            style={{
              background: filter === f ? DARK : '#fff',
              color: filter === f ? '#fff' : '#3f3d39',
              borderColor: filter === f ? DARK : '#dedcd7',
            }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : leaves.length === 0
        ? <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-10 text-center text-sm text-neutral-400">No leave requests found.</div>
        : (
          <div className="space-y-3">
            {leaves.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${GOLD}20`, color: DARK }}>
                      {(l.profiles?.name ?? 'S')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{l.profiles?.name ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${GOLD}15`, color: GOLD }}>
                          {LEAVE_TYPE_LABEL[l.leave_type] ?? l.leave_type}
                        </span>
                        <span className="text-xs text-neutral-400">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</span>
                        <StatusChip status={l.status} color={LEAVE_COLOR[l.status] ?? '#8b8881'} />
                      </div>
                      {l.reason && <p className="text-xs text-neutral-500 mt-1 italic">&ldquo;{l.reason}&rdquo;</p>}
                    </div>
                  </div>
                  {l.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => decide(l.id, false)} disabled={actingId === l.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border disabled:opacity-50"
                        style={{ borderColor: `${RED}40`, color: RED, background: `${RED}0d` }}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button onClick={() => decide(l.id, true)} disabled={actingId === l.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border disabled:opacity-50"
                        style={{ borderColor: `${GREEN}40`, color: GREEN, background: `${GREEN}0d` }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400 py-6">
      <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminStaffPage() {
  const [tab, setTab] = useState<'performance' | 'attendance' | 'leaves'>('attendance');

  const tabs = [
    { id: 'attendance'  as const, label: 'Attendance',  icon: Clock },
    { id: 'performance' as const, label: 'Performance', icon: BarChart2 },
    { id: 'leaves'      as const, label: 'Leave Requests', icon: Calendar },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Staff Management</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Attendance, performance and leave requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-neutral-100 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === id ? '#fff' : 'transparent',
              color: tab === id ? '#171614' : '#6e6b65',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'attendance'  && <AttendanceTab />}
      {tab === 'performance' && <PerformanceTab />}
      {tab === 'leaves'      && <LeavesTab />}
    </div>
  );
}
