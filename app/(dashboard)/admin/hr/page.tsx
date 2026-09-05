'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { hrAdminApi } from '@/api/erp.api';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

const GREEN = '#10b981'; const RED = '#ef4444'; const ORANGE = '#f97316';
const BLUE = '#3b82f6'; type Leave = { id: string; staff_id: string; leave_type: string; start_date: string; end_date: string; reason: string | null; status: string; profiles?: { name: string }[] | null };
type Attendance = { id: string; staff_id: string; record_date: string; clock_in: string | null; clock_out: string | null; profiles?: { name: string }[] | null };
type Shift = { id: string; staff_id: string; shift_date: string; start_time: string | null; end_time: string | null; is_day_off: boolean; profiles?: { name: string }[] | null };

export default function AdminHRPage() {
  const [tab, setTab]           = useState<'leaves' | 'attendance' | 'shifts'>('leaves');
  const [leaves, setLeaves]     = useState<Leave[]>([]);
  const [attendance, setAtt]    = useState<Attendance[]>([]);
  const [shifts, setShifts]     = useState<Shift[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
    return Promise.allSettled([
      hrAdminApi.listLeaves({ status: 'pending' }),
      hrAdminApi.listAttendance({ startDate: weekAgo, endDate: today }),
      hrAdminApi.listShifts({ startDate: today }),
    ]).then(([l, a, s]) => {
      if (l.status === 'fulfilled') setLeaves((l.value.data.data ?? []) as Leave[]);
      if (a.status === 'fulfilled') setAtt((a.value.data.data ?? []) as Attendance[]);
      if (s.status === 'fulfilled') setShifts((s.value.data.data ?? []) as Shift[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['staff_leaves', 'attendance_records', 'shifts'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleLeaveDecision = async (id: string, approved: boolean, reason?: string) => {
    try {
      await hrAdminApi.approveLeave(id, { approved, rejectionReason: reason });
      toast.success(approved ? 'Leave approved' : 'Leave rejected');
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch { toast.error('Action failed'); }
  };

  const tabs = [
    { id: 'leaves',     label: `Leave Requests (${leaves.length})`, icon: Calendar },
    { id: 'attendance', label: 'Attendance (7 days)',                icon: Clock },
    { id: 'shifts',     label: 'Upcoming Shifts',                   icon: Users },
  ] as const;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">HR Management</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Staff leaves, attendance &amp; schedules</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700')}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Leave requests */}
      {tab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-800">Pending Leave Requests</h3>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-neutral-400">Loading…</div>
          ) : leaves.length === 0 ? (
            <div className="px-5 py-8 text-center text-neutral-400">No pending leave requests</div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {leaves.map((l) => {
                const staffName = Array.isArray(l.profiles) ? l.profiles[0]?.name : null;
                return (
                  <div key={l.id} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-800">{staffName ?? 'Staff'}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                          style={{ background: `${BLUE}18`, color: BLUE }}>{l.leave_type}</span>
                      </div>
                      <p className="text-xs text-neutral-500">{formatDate(l.start_date)} → {formatDate(l.end_date)}</p>
                      {l.reason && <p className="text-xs text-neutral-400 italic">&ldquo;{l.reason}&rdquo;</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleLeaveDecision(l.id, true)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        style={{ background: `${GREEN}18`, color: GREEN }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => handleLeaveDecision(l.id, false, 'Rejected by admin')}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        style={{ background: `${RED}18`, color: RED }}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-800">Attendance — Last 7 Days</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                  {['Staff', 'Date', 'Clock In', 'Clock Out', 'Hours'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
                ) : attendance.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No attendance records</td></tr>
                ) : attendance.map((a) => {
                  const staffName = Array.isArray(a.profiles) ? a.profiles[0]?.name : null;
                  const clockIn = a.clock_in ? new Date(a.clock_in) : null;
                  const clockOut = a.clock_out ? new Date(a.clock_out) : null;
                  const hours = clockIn && clockOut ? ((clockOut.getTime() - clockIn.getTime()) / 3_600_000).toFixed(1) : null;
                  return (
                    <tr key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-800">{staffName ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDate(a.record_date)}</td>
                      <td className="px-4 py-3 font-mono text-neutral-700">{clockIn ? clockIn.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3 font-mono text-neutral-700">{clockOut ? clockOut.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: ORANGE }}>Active</span>}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: hours ? GREEN : ORANGE }}>{hours ? `${hours}h` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shifts */}
      {tab === 'shifts' && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-800">Upcoming Shifts</h3>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-neutral-400">Loading…</div>
          ) : shifts.length === 0 ? (
            <div className="px-5 py-8 text-center text-neutral-400">No upcoming shifts found. Use the API to create shifts for staff.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                    {['Staff', 'Date', 'Start', 'End', 'Type'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => {
                    const staffName = Array.isArray(s.profiles) ? s.profiles[0]?.name : null;
                    return (
                      <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-800">{staffName ?? '—'}</td>
                        <td className="px-4 py-3 text-neutral-500">{formatDate(s.shift_date)}</td>
                        <td className="px-4 py-3 font-mono text-neutral-700">{s.start_time ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-neutral-700">{s.end_time ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={s.is_day_off ? { background: `${RED}15`, color: RED } : { background: `${GREEN}15`, color: GREEN }}>
                            {s.is_day_off ? 'Day Off' : 'Working'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
