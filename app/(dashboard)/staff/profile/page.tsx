'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { staffDashboardApi } from '@/api/staff-dashboard.api';
import type { OwnStaffProfile } from '@/api/staff-dashboard.api';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GOLD = '#8b8881'; export default function StaffProfilePage() {
  const [profile, setProfile] = useState<OwnStaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ mpesaNumber: '', bankName: '', bankAccount: '', emergencyContactName: '', emergencyContactPhone: '' });

  const load = useCallback(() => {
    return staffDashboardApi.getOwnProfile()
      .then((res) => {
        const p = res.data.data;
        setProfile(p);
        setForm({
          mpesaNumber:          p.staffProfile?.mpesa_number ?? '',
          bankName:             p.staffProfile?.bank_name ?? '',
          bankAccount:          p.staffProfile?.bank_account ?? '',
          emergencyContactName: p.staffProfile?.emergency_contact_name ?? '',
          emergencyContactPhone: p.staffProfile?.emergency_contact_phone ?? '',
        });
      })
      .catch(() => { /* profile fetch failed */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await staffDashboardApi.upsertStaffProfile(form);
      toast.success('Profile updated');
      load();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  const sp = profile?.staffProfile;
  const branchName = (profile?.branches as { name?: string } | null)?.name ?? null;

  return (
    <div className="space-y-5 pb-8 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Profile</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Your employment details and payment information</p>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: `#171614` }}>
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: `${GOLD}28`, color: GOLD }}>
          {profile?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-white truncate">{profile?.name ?? '—'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Staff</p>
          {branchName && <p className="text-xs mt-0.5" style={{ color: `${GOLD}cc` }}>{branchName}</p>}
        </div>
      </div>

      {/* Employment info */}
      {sp && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800">Employment Details</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {[
              { label: 'Salary Type',    value: sp.salary_type?.replace('_', ' ') },
              { label: 'Base Salary',    value: sp.base_salary ? `KES ${sp.base_salary}` : '—' },
              { label: 'Commission %',   value: `${sp.commission_pct}%` },
              { label: 'Hire Date',      value: sp.hire_date ? formatDate(sp.hire_date) : '—' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-neutral-400 font-medium">{item.label}</p>
                <p className="text-neutral-800 font-semibold mt-0.5">{item.value ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editable payment info */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-800">Payment & Emergency Details</h3>
        <p className="text-xs text-neutral-400">This information is used for payroll disbursements. Keep it up to date.</p>
        {[
          { label: 'M-Pesa Number',          field: 'mpesaNumber',           placeholder: '07XX XXX XXX' },
          { label: 'Bank Name',              field: 'bankName',              placeholder: 'e.g. Equity Bank' },
          { label: 'Bank Account Number',    field: 'bankAccount',           placeholder: 'Account number' },
          { label: 'Emergency Contact Name', field: 'emergencyContactName',  placeholder: 'Full name' },
          { label: 'Emergency Contact Phone',field: 'emergencyContactPhone', placeholder: '07XX XXX XXX' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
            <input type="text" placeholder={placeholder}
              value={(form as Record<string, string>)[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition-colors" />
          </div>
        ))}
        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: GOLD }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
