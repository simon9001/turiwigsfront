'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Users, Save, RefreshCw, Check, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { schedulingApi } from '@/api/scheduling.api';
import toast from 'react-hot-toast';
import type { BusinessSettings } from '@/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GOLD = '#8b8881';
const DARK = '#171614';

interface StaffProfile { id: string; name: string; avatar_url?: string; is_active: boolean }
interface ScheduleEntry { dayOfWeek: number; startTime: string; endTime: string }

// ─── Business hours tab ───────────────────────────────────────────────────────

function BusinessHoursTab() {
  const [form, setForm] = useState({
    businessStartTime: '08:00',
    businessEndTime: '18:00',
    slotIntervalMinutes: 30,
    workingDays: [1, 2, 3, 4, 5, 6],
    staffOrdersEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    schedulingApi.getSettings()
      .then(({ data }) => {
        const s = data.data as BusinessSettings & { staff_orders_enabled?: boolean };
        if (s) setForm({
          businessStartTime:   s.business_start_time,
          businessEndTime:     s.business_end_time,
          slotIntervalMinutes: s.slot_interval_minutes,
          workingDays:         s.working_days,
          staffOrdersEnabled:  s.staff_orders_enabled ?? true,
        });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day].sort(),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await schedulingApi.updateSettings(form);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return (
    <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
      <RefreshCw className="h-4 w-4 animate-spin" /> Loading settings…
    </div>
  );

  return (
    <div className="space-y-5 max-w-lg">

      {/* Working days */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-neutral-800 mb-1">Working Days</p>
        <p className="text-xs text-neutral-400 mb-3">Days the salon is open for bookings</p>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, idx) => {
            const active = form.workingDays.includes(idx);
            return (
              <button key={idx} onClick={() => toggleDay(idx)}
                className="w-12 h-10 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  background: active ? DARK : '#fff',
                  color: active ? '#fff' : '#3f3d39',
                  borderColor: active ? DARK : '#dedcd7',
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hours + interval */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-neutral-800 mb-1">Business Hours</p>
        <p className="text-xs text-neutral-400 mb-4">Default opening and closing time</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Opens at</label>
            <input type="time" value={form.businessStartTime}
              onChange={(e) => setForm((f) => ({ ...f, businessStartTime: e.target.value }))}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Closes at</label>
            <input type="time" value={form.businessEndTime}
              onChange={(e) => setForm((f) => ({ ...f, businessEndTime: e.target.value }))}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Slot interval</label>
          <select value={form.slotIntervalMinutes}
            onChange={(e) => setForm((f) => ({ ...f, slotIntervalMinutes: Number(e.target.value) }))}
            className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-400 bg-white">
            {[15, 30, 45, 60].map((v) => <option key={v} value={v}>{v} min intervals</option>)}
          </select>
          <p className="text-[11px] text-neutral-400 mt-1.5">
            Slots appear every {form.slotIntervalMinutes} minutes (e.g. 8:00, 8:{String(form.slotIntervalMinutes).padStart(2,'0')}, 9:00…)
          </p>
        </div>
      </div>

      {/* Staff orders toggle */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-800">Staff Orders Access</p>
            <p className="text-xs text-neutral-400 mt-0.5">Show or hide the Orders section in the staff dashboard</p>
          </div>
          <button onClick={() => setForm((f) => ({ ...f, staffOrdersEnabled: !f.staffOrdersEnabled }))}
            className="flex-shrink-0 transition-colors"
            title={form.staffOrdersEnabled ? 'Click to disable' : 'Click to enable'}>
            {form.staffOrdersEnabled
              ? <ToggleRight className="h-8 w-8" style={{ color: GOLD }} />
              : <ToggleLeft className="h-8 w-8 text-neutral-300" />}
          </button>
        </div>
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl"
          style={{ background: form.staffOrdersEnabled ? '#f0fdf4' : '#fff7ed', border: `1px solid ${form.staffOrdersEnabled ? '#86efac' : '#fed7aa'}` }}>
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: form.staffOrdersEnabled ? '#16a34a' : '#ea580c' }} />
          <p className="text-xs" style={{ color: form.staffOrdersEnabled ? '#15803d' : '#c2410c' }}>
            {form.staffOrdersEnabled ? 'Staff can view and manage orders from their dashboard.' : 'The Orders link is hidden from the staff dashboard navigation.'}
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
        style={{ background: GOLD }}>
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

// ─── Staff schedule row ───────────────────────────────────────────────────────

function StaffScheduleRow({ staff }: { staff: StaffProfile }) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    return schedulingApi.listSchedules(staff.id)
      .then(({ data }) => setSchedule((data.data ?? []).map((s) => ({
        dayOfWeek: s.day_of_week, startTime: s.start_time, endTime: s.end_time,
      }))))
      .catch(() => { /* ignore */ })
      .finally(() => setLoaded(true));
  }, [staff.id]);

  useEffect(() => { if (open && !loaded) load(); }, [open, loaded, load]);

  function toggleDay(day: number) {
    setSchedule((prev) => {
      const has = prev.some((e) => e.dayOfWeek === day);
      if (has) return prev.filter((e) => e.dayOfWeek !== day);
      return [...prev, { dayOfWeek: day, startTime: '08:00', endTime: '17:00' }]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  }

  function updateTime(day: number, field: 'startTime' | 'endTime', value: string) {
    setSchedule((prev) => prev.map((e) => e.dayOfWeek === day ? { ...e, [field]: value } : e));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await schedulingApi.replaceWeeklySchedule(staff.id, schedule);
      toast.success(`Schedule saved for ${staff.name}`);
    } catch {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  }

  const activeDays = new Set(schedule.map((e) => e.dayOfWeek));

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
            style={{ background: DARK }}>
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900">{staff.name}</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {activeDays.size === 0 ? 'No personal schedule — uses business hours' : `${activeDays.size} day${activeDays.size > 1 ? 's' : ''}/week`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {DAY_LABELS.map((label, idx) => (
            <span key={idx} className="w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center hidden sm:flex"
              style={{ background: activeDays.has(idx) ? `${GOLD}20` : '#e9e8e4', color: activeDays.has(idx) ? GOLD : '#8b8881' }}>
              {label[0]}
            </span>
          ))}
          <span className="text-neutral-300 ml-1 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-neutral-100 px-5 py-4 bg-neutral-50/50 space-y-4">
          {!loaded ? (
            <p className="text-sm text-neutral-400 flex items-center gap-2 py-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Working days</p>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, idx) => {
                    const active = activeDays.has(idx);
                    return (
                      <button key={idx} onClick={() => toggleDay(idx)}
                        className="w-12 h-9 rounded-xl text-sm font-semibold border transition-all"
                        style={{
                          background: active ? DARK : '#fff', color: active ? '#fff' : '#3f3d39',
                          borderColor: active ? DARK : '#dedcd7',
                        }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {schedule.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Hours per day</p>
                  {schedule.map((entry) => (
                    <div key={entry.dayOfWeek} className="flex items-center gap-3">
                      <span className="w-10 text-sm font-semibold text-neutral-700">{DAY_LABELS[entry.dayOfWeek]}</span>
                      <input type="time" value={entry.startTime}
                        onChange={(e) => updateTime(entry.dayOfWeek, 'startTime', e.target.value)}
                        className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                      <span className="text-neutral-400 text-xs">to</span>
                      <input type="time" value={entry.endTime}
                        onChange={(e) => updateTime(entry.dayOfWeek, 'endTime', e.target.value)}
                        className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-400" />
                    </div>
                  ))}
                </div>
              )}

              {schedule.length === 0 && (
                <p className="text-xs text-neutral-400 py-1">
                  Select working days above to set per-day hours.
                </p>
              )}

              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: GOLD }}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save Schedule'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSchedulingPage() {
  const [tab, setTab] = useState<'hours' | 'staff'>('hours');
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (tab !== 'staff') return;
    schedulingApi.listStaff()
      .then(({ data }) => setStaff((data.data as StaffProfile[]) ?? []))
      .catch(() => toast.error('Could not load staff'))
      .finally(() => setLoadingStaff(false));
  }, [tab]);

  const tabs = [
    { id: 'hours' as const, label: 'Business Hours', icon: Clock },
    { id: 'staff' as const, label: 'Staff Schedules', icon: Users },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Scheduling</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Configure business hours, slot intervals and staff working days</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm"
        style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
        <div className="text-neutral-700">
          <strong className="font-semibold">How slots work:</strong> When a customer picks a date, the system automatically generates available time slots from staff working hours, removes times that are already booked, and shows only what is free. No manual slot creation needed.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit bg-neutral-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => {
            if (id === tab) return;
            if (id === 'staff') setLoadingStaff(true);
            setTab(id);
          }}
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

      {tab === 'hours' && <BusinessHoursTab />}

      {tab === 'staff' && (
        <div className="space-y-3">
          {loadingStaff && (
            <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading staff…
            </div>
          )}
          {!loadingStaff && staff.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-neutral-200 p-10 text-center">
              <Users className="h-8 w-8 text-neutral-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-500">No staff members found</p>
              <p className="text-xs text-neutral-400 mt-1">Invite staff via Admin → Users, then set schedules here.</p>
            </div>
          )}
          {!loadingStaff && staff.map((s) => <StaffScheduleRow key={s.id} staff={s} />)}
        </div>
      )}
    </div>
  );
}
