'use client';

import { useEffect, useState, useCallback } from 'react';
import { Truck, Plus } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { suppliersApi } from '@/api/erp.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const GOLD = '#8b8881'; const GREEN = '#10b981'; const ORANGE = '#f97316'; const BLUE = '#3b82f6';

type Supplier = { id: string; name: string; contact_name?: string; email?: string; phone?: string; is_active: boolean };
type PO = { id: string; po_number: string; status: string; total_amount: number; expected_at?: string; suppliers?: { name: string }[] | null };

const PO_STATUS: Record<string, string> = { draft: ORANGE, sent: BLUE, received: GREEN, cancelled: '#8b8881' };

export default function AdminSuppliersPage() {
  const [tab, setTab]           = useState<'suppliers' | 'orders'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pos, setPOs]           = useState<PO[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', address: '' });

  // No setLoading(true) here: this also runs on realtime pushes and a 30s
  // interval, and flashing the whole page to a spinner every refresh is worse
  // than letting the table swap in place. `loading` starts true for the first
  // paint and is only ever turned off.
  const load = useCallback(() => {
    return Promise.allSettled([suppliersApi.list(), suppliersApi.listPOs()]).then(([s, p]) => {
      if (s.status === 'fulfilled') setSuppliers((s.value.data.data ?? []) as Supplier[]);
      if (p.status === 'fulfilled') setPOs((p.value.data.data ?? []) as PO[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['suppliers', 'purchase_orders'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      await suppliersApi.create(form);
      toast.success('Supplier added');
      setShowAdd(false);
      setForm({ name: '', contactName: '', email: '', phone: '', address: '' });
      load();
    } catch { toast.error('Failed to add supplier'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Suppliers</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage suppliers and purchase orders</p>
        </div>
        <div className="flex gap-2">
          {tab === 'suppliers' && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: GOLD }}>
              <Plus className="h-3.5 w-3.5" /> Add Supplier
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {[{ id: 'suppliers', label: `Suppliers (${suppliers.length})` }, { id: 'orders', label: `Purchase Orders (${pos.length})` }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as 'suppliers' | 'orders')}
            className={cn('rounded-lg px-3 py-2 text-xs font-medium transition-all', tab === t.id ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-neutral-50">
            {loading ? (
              <div className="px-5 py-8 text-center text-neutral-400">Loading…</div>
            ) : suppliers.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Truck className="h-8 w-8 mx-auto mb-2 text-neutral-200" />
                <p className="text-sm text-neutral-400">No suppliers yet. Add your first supplier.</p>
              </div>
            ) : suppliers.map((s) => (
              <div key={s.id} className="px-5 py-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-neutral-800">{s.name}</p>
                  {s.contact_name && <p className="text-xs text-neutral-500">{s.contact_name}</p>}
                  <div className="flex gap-3 text-xs text-neutral-400">
                    {s.email && <span>{s.email}</span>}
                    {s.phone && <span>{s.phone}</span>}
                  </div>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={s.is_active ? { background: `${GREEN}15`, color: GREEN } : { background: '#e9e8e4', color: '#55534e' }}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                  {['PO Number', 'Supplier', 'Total', 'Expected', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
                ) : pos.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No purchase orders yet.</td></tr>
                ) : pos.map((p) => {
                  const suppName = Array.isArray(p.suppliers) ? p.suppliers[0]?.name : null;
                  return (
                    <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono font-semibold text-neutral-700">{p.po_number}</td>
                      <td className="px-4 py-3 text-neutral-600">{suppName ?? '—'}</td>
                      <td className="px-4 py-3 font-bold text-neutral-900">{formatPrice(Number(p.total_amount))}</td>
                      <td className="px-4 py-3 text-neutral-500">{p.expected_at ? formatDate(p.expected_at) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                          style={{ background: `${PO_STATUS[p.status] ?? ORANGE}18`, color: PO_STATUS[p.status] ?? ORANGE }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Add Supplier</h2>
            {[
              { label: 'Name *', field: 'name', required: true },
              { label: 'Contact Name', field: 'contactName' },
              { label: 'Email', field: 'email' },
              { label: 'Phone', field: 'phone' },
              { label: 'Address', field: 'address' },
            ].map(({ label, field, required }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
                <input required={required} type="text" value={(form as Record<string, string>)[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" />
              </div>
            ))}
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
