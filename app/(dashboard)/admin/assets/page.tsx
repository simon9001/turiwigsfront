'use client';

import { useEffect, useState, useCallback } from 'react';
import { Cpu, Plus, AlertTriangle } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { assetsApi } from '@/api/erp.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GREEN = '#10b981'; const GOLD = '#8b8881'; const ORANGE = '#f97316'; const RED = '#ef4444'; type Asset = { id: string; name: string; asset_number?: string; category?: string; status: string; purchase_cost?: number; purchase_date?: string; next_service_date?: string; location?: string };

const STATUS_COLOR: Record<string, string> = { active: GREEN, maintenance: ORANGE, retired: '#8b8881', disposed: RED };

export default function AdminAssetsPage() {
  const [assets, setAssets]   = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', assetNumber: '', category: '', location: '', purchaseCost: '', purchaseDate: '', usefulLifeYears: '', notes: '' });

  const load = useCallback(() => {
    return assetsApi.list()
      .then((res) => setAssets((res.data.data ?? []) as Asset[]))
      .catch(() => { /* no assets */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['assets'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      await assetsApi.create({
        ...form,
        purchaseCost:      form.purchaseCost     ? Number(form.purchaseCost)     : undefined,
        usefulLifeYears:   form.usefulLifeYears   ? Number(form.usefulLifeYears) : undefined,
        purchaseDate:      form.purchaseDate      || undefined,
      });
      toast.success('Asset added');
      setShowAdd(false);
      setForm({ name: '', assetNumber: '', category: '', location: '', purchaseCost: '', purchaseDate: '', usefulLifeYears: '', notes: '' });
      load();
    } catch { toast.error('Failed to add asset'); }
    finally { setSubmitting(false); }
  };

  // Read the clock once, when the page mounts. Calling Date.now() while
  // rendering makes the render impure and the output non-reproducible.
  const [now] = useState(() => Date.now());

  const dueSoon = assets.filter((a) => {
    if (!a.next_service_date) return false;
    const diff = new Date(a.next_service_date).getTime() - now;
    return diff > 0 && diff < 7 * 864e5;
  });

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Asset Management</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Equipment, tools &amp; maintenance tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: GOLD }}>
            <Plus className="h-3.5 w-3.5" /> Add Asset
          </button>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: `${ORANGE}08`, borderColor: `${ORANGE}25` }}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ORANGE }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: ORANGE }}>Maintenance Due Soon</p>
            {dueSoon.map((a) => (
              <p key={a.id} className="text-xs text-neutral-600 mt-0.5">{a.name} — due {a.next_service_date ? formatDate(a.next_service_date) : '—'}</p>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets',   value: assets.length,                                          color: GOLD },
          { label: 'Active',         value: assets.filter((a) => a.status === 'active').length,     color: GREEN },
          { label: 'Maintenance',    value: assets.filter((a) => a.status === 'maintenance').length, color: ORANGE },
          { label: 'Maint. Due',     value: dueSoon.length,                                         color: RED },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-neutral-100 p-4 text-center shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                {['Asset', 'Category', 'Location', 'Cost', 'Status', 'Next Service'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">
                  <Cpu className="h-8 w-8 mx-auto mb-2 text-neutral-200" />
                  <p className="text-neutral-400">No assets registered yet.</p>
                </td></tr>
              ) : assets.map((a) => (
                <tr key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {a.name}
                    {a.asset_number && <span className="ml-1 text-[9px] text-neutral-400 font-mono">#{a.asset_number}</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{a.category ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-500">{a.location ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{a.purchase_cost ? formatPrice(a.purchase_cost) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      style={{ background: `${STATUS_COLOR[a.status] ?? GOLD}18`, color: STATUS_COLOR[a.status] ?? GOLD }}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: dueSoon.find((d) => d.id === a.id) ? ORANGE : undefined }}>
                    {a.next_service_date ? formatDate(a.next_service_date) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-3 my-4">
            <h2 className="text-base font-bold text-neutral-900">Add Asset</h2>
            {[
              { label: 'Name *', field: 'name', required: true },
              { label: 'Asset Number', field: 'assetNumber' },
              { label: 'Category', field: 'category' },
              { label: 'Location', field: 'location' },
              { label: 'Purchase Cost (KES)', field: 'purchaseCost', type: 'number' },
              { label: 'Purchase Date', field: 'purchaseDate', type: 'date' },
              { label: 'Useful Life (years)', field: 'usefulLifeYears', type: 'number' },
            ].map(({ label, field, type = 'text', required = false }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
                <input required={required} type={type} value={(form as Record<string, string>)[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
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
