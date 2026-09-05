'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Plus, Calculator, CheckCircle, DollarSign } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { payrollApi } from '@/api/erp.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GREEN = '#10b981'; const GOLD = '#8b8881'; const ORANGE = '#f97316';
const BLUE = '#3b82f6'; const PURPLE = '#8b5cf6';

type Run = { id: string; period_start: string; period_end: string; status: string; total_amount: number; approved_at?: string; paid_at?: string };

const STATUS_COLOR: Record<string, string> = { draft: ORANGE, approved: BLUE, paid: GREEN };

export default function AdminPayrollPage() {
  const [runs, setRuns]         = useState<Run[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd:   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    notes: '',
  });

  const load = useCallback(() => {
    return payrollApi.listRuns()
      .then((res) => setRuns((res.data.data ?? []) as Run[]))
      .catch(() => { /* no runs yet */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['payroll_runs', 'commissions'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payrollApi.createRun(form);
      toast.success('Payroll run created');
      setShowCreate(false);
      load();
    } catch { toast.error('Failed to create run'); }
    finally { setSubmitting(false); }
  };

  const handleCalculate = async (id: string) => {
    setActionId(id);
    try {
      await payrollApi.calculate(id);
      toast.success('Items calculated from staff profiles & commissions');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Calculation failed';
      toast.error(msg);
    } finally { setActionId(null); }
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await payrollApi.approve(id);
      toast.success('Payroll approved');
      load();
    } catch { toast.error('Approval failed'); } finally { setActionId(null); }
  };

  const handlePay = async (id: string) => {
    if (!confirm('Mark this payroll run as paid? This will mark all commissions as paid.')) return;
    setActionId(id);
    try {
      await payrollApi.pay(id);
      toast.success('Payroll marked as paid');
      load();
    } catch { toast.error('Pay failed'); } finally { setActionId(null); }
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Payroll</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage staff salary &amp; commission payouts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: GOLD }}>
            <Plus className="h-3.5 w-3.5" /> New Run
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border p-4 space-y-1 text-xs" style={{ background: `${BLUE}08`, borderColor: `${BLUE}25` }}>
        <p className="font-semibold text-neutral-700">How Payroll Works:</p>
        <p className="text-neutral-500">1. Create a run for a period → 2. Click Calculate (auto-sums base salary + commissions) → 3. Review → 4. Approve → 5. Mark as Paid (commission records updated)</p>
      </div>

      {/* Runs list */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-800">Payroll Runs</h3>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-neutral-400">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-neutral-200" />
            <p className="text-sm text-neutral-400">No payroll runs yet. Create your first run above.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {runs.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-800">
                      {formatDate(r.period_start)} → {formatDate(r.period_end)}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      style={{ background: `${STATUS_COLOR[r.status] ?? GOLD}18`, color: STATUS_COLOR[r.status] ?? GOLD }}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">Total: <strong style={{ color: GOLD }}>{formatPrice(Number(r.total_amount))}</strong></p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {r.status === 'draft' && (
                    <>
                      <button onClick={() => handleCalculate(r.id)} disabled={actionId === r.id}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        style={{ background: `${PURPLE}18`, color: PURPLE }}>
                        <Calculator className="h-3.5 w-3.5" /> Calculate
                      </button>
                      <button onClick={() => handleApprove(r.id)} disabled={actionId === r.id}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        style={{ background: `${BLUE}18`, color: BLUE }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => handlePay(r.id)} disabled={actionId === r.id}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                      style={{ background: GREEN }}>
                      <DollarSign className="h-3.5 w-3.5" /> Mark Paid
                    </button>
                  )}
                  {r.status === 'paid' && (
                    <span className="text-xs font-medium" style={{ color: GREEN }}>✓ Paid {r.paid_at ? formatDate(r.paid_at) : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">New Payroll Run</h2>
            {[
              { label: 'Period Start', field: 'periodStart' },
              { label: 'Period End',   field: 'periodEnd' },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
                <input required type="date" value={(form as Record<string, string>)[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-neutral-200 text-neutral-600">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: GOLD }}>
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
