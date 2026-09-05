'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle, Trash2 } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { expensesApi } from '@/api/erp.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GREEN = '#10b981'; const GOLD = '#8b8881'; const RED = '#ef4444'; const ORANGE = '#f97316';

type Expense = {
  id: string; description: string; amount: number; expense_date: string;
  approved_at: string | null; approved_by: string | null;
  expense_categories?: { name: string }[] | null;
  profiles?: { name: string }[] | null;
};

type Category = { id: string; name: string };

export default function AdminExpensesPage() {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [categories, setCats]     = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], categoryId: '', notes: '' });

  const load = useCallback(() => {
    return Promise.allSettled([expensesApi.list(), expensesApi.listCategories()]).then(([e, c]) => {
      if (e.status === 'fulfilled') setExpenses((e.value.data.data ?? []) as Expense[]);
      if (c.status === 'fulfilled') setCats((c.value.data.data ?? []) as Category[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['expenses'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.expenseDate) return;
    setSubmitting(true);
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount), categoryId: form.categoryId || undefined });
      toast.success('Expense recorded');
      setShowAdd(false);
      setForm({ description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], categoryId: '', notes: '' });
      load();
    } catch { toast.error('Failed to record expense'); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await expensesApi.approve(id);
      toast.success('Expense approved');
      setExpenses((prev) => prev.map((ex) => ex.id === id ? { ...ex, approved_at: new Date().toISOString() } : ex));
    } catch { toast.error('Approval failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expensesApi.remove(id);
      toast.success('Expense deleted');
      setExpenses((prev) => prev.filter((ex) => ex.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const totalApproved   = expenses.filter((e) => e.approved_at).reduce((s, e) => s + Number(e.amount), 0);
  const totalUnapproved = expenses.filter((e) => !e.approved_at).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Expenses</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Track and approve business expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: GOLD }}>
            <Plus className="h-3.5 w-3.5" /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Approved Total',   value: formatPrice(totalApproved),   color: RED },
          { label: 'Pending Approval', value: formatPrice(totalUnapproved), color: ORANGE },
          { label: 'Total Records',    value: expenses.length,              color: GOLD },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-neutral-100 p-4 text-center shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{k.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-800">All Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                {['Date', 'Description', 'Category', 'Amount', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No expenses recorded yet.</td></tr>
              ) : expenses.map((ex) => {
                const catName = Array.isArray(ex.expense_categories) ? ex.expense_categories[0]?.name : null;
                return (
                  <tr key={ex.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-500">{formatDate(ex.expense_date)}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800 max-w-[200px] truncate">{ex.description}</td>
                    <td className="px-4 py-3 text-neutral-500">{catName ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-neutral-900">{formatPrice(Number(ex.amount))}</td>
                    <td className="px-4 py-3">
                      {ex.approved_at
                        ? <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${GREEN}15`, color: GREEN }}>Approved</span>
                        : <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${ORANGE}15`, color: ORANGE }}>Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {!ex.approved_at && (
                          <button onClick={() => handleApprove(ex.id)} className="rounded-lg p-1.5 hover:bg-green-50 transition-colors" title="Approve">
                            <CheckCircle className="h-3.5 w-3.5" style={{ color: GREEN }} />
                          </button>
                        )}
                        {!ex.approved_at && (
                          <button onClick={() => handleDelete(ex.id)} className="rounded-lg p-1.5 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" style={{ color: RED }} />
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
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Add Expense</h2>
            {[
              { label: 'Description', field: 'description', type: 'text', placeholder: 'What was this for?' },
              { label: 'Amount (KES)', field: 'amount', type: 'number', placeholder: '0' },
              { label: 'Date', field: 'expenseDate', type: 'date', placeholder: '' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
                <input required type={type} placeholder={placeholder}
                  value={(form as Record<string, string>)[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Category</label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none bg-white focus:border-neutral-900">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-neutral-200 text-neutral-600">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: GOLD }}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
