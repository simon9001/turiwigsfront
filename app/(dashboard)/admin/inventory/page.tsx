'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { inventoryApi } from '@/api/erp.api';
import { formatPrice } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GOLD = '#8b8881'; const RED = '#ef4444'; const ORANGE = '#f97316'; const GREEN = '#10b981';

type Item = {
  id: string; name: string; unit: string; sku?: string;
  stock_quantity: number; low_stock_threshold: number;
  unit_cost?: number; is_active: boolean;
  inventory_categories?: { name: string }[] | null;
};

export default function AdminInventoryPage() {
  const [items, setItems]       = useState<Item[]>([]);
  const [alerts, setAlerts]     = useState<{ lowStock: Item[]; outOfStock: Item[] } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [txnItem, setTxnItem]   = useState<Item | null>(null);
  const [txnType, setTxnType]   = useState<'stock_in' | 'stock_out'>('stock_in');
  const [txnQty, setTxnQty]     = useState('');
  const [txnNotes, setTxnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    return Promise.allSettled([inventoryApi.listItems(), inventoryApi.getLowStock()]).then(([i, a]) => {
      if (i.status === 'fulfilled') setItems((i.value.data.data ?? []) as Item[]);
      if (a.status === 'fulfilled') setAlerts(a.value.data.data as { lowStock: Item[]; outOfStock: Item[] });
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['inventory_items', 'inventory_transactions'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleTxn = async () => {
    if (!txnItem || !txnQty || Number(txnQty) <= 0) return;
    setSubmitting(true);
    try {
      await inventoryApi.recordTxn({ itemId: txnItem.id, type: txnType, quantity: Number(txnQty), notes: txnNotes || undefined });
      toast.success(`${txnType === 'stock_in' ? 'Stock added' : 'Stock removed'} successfully`);
      setTxnItem(null); setTxnQty(''); setTxnNotes('');
      load();
    } catch { toast.error('Transaction failed'); }
    finally { setSubmitting(false); }
  };

  const totalItems = items.length;
  const lowCount   = alerts?.lowStock.length ?? 0;
  const outCount   = alerts?.outOfStock.length ?? 0;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Inventory</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Salon consumables &amp; supplies</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Items',  value: totalItems, color: GOLD },
          { label: 'Low Stock',    value: lowCount,   color: ORANGE },
          { label: 'Out of Stock', value: outCount,   color: RED },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-neutral-100 p-4 text-center shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(lowCount > 0 || outCount > 0) && (
        <div className="rounded-2xl border p-4 space-y-2" style={{ background: `${ORANGE}08`, borderColor: `${ORANGE}25` }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" style={{ color: ORANGE }} />
            <span className="text-sm font-semibold" style={{ color: ORANGE }}>Stock Alerts</span>
          </div>
          {alerts?.outOfStock.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-xs">
              <span className="text-neutral-700">{i.name}</span>
              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ background: `${RED}15`, color: RED }}>Out of stock</span>
            </div>
          ))}
          {alerts?.lowStock.slice(0, 5).map((i) => (
            <div key={i.id} className="flex items-center justify-between text-xs">
              <span className="text-neutral-700">{i.name}</span>
              <span style={{ color: ORANGE }}>{i.stock_quantity} {i.unit} remaining</span>
            </div>
          ))}
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-800">All Items</h3>
          <span className="text-xs text-neutral-400">{totalItems} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f4f4f2', borderBottom: '1px solid #e9e8e4' }}>
                {['Item', 'Category', 'Stock', 'Unit', 'Cost', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No inventory items yet. Add your first item to get started.</td></tr>
              ) : items.map((item) => {
                const isLow  = Number(item.stock_quantity) <= Number(item.low_stock_threshold) && Number(item.stock_quantity) > 0;
                const isOut  = Number(item.stock_quantity) <= 0;
                const catName = item.inventory_categories?.[0]?.name;
                return (
                  <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-800">{item.name}{item.sku && <span className="ml-1 text-[9px] text-neutral-400 font-mono">#{item.sku}</span>}</td>
                    <td className="px-4 py-3 text-neutral-500">{catName ?? '—'}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: isOut ? RED : isLow ? ORANGE : GREEN }}>{item.stock_quantity}</td>
                    <td className="px-4 py-3 text-neutral-500">{item.unit}</td>
                    <td className="px-4 py-3 text-neutral-600">{item.unit_cost ? formatPrice(item.unit_cost) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={isOut ? { background: `${RED}15`, color: RED } : isLow ? { background: `${ORANGE}15`, color: ORANGE } : { background: `${GREEN}15`, color: GREEN }}>
                        {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setTxnItem(item); setTxnType('stock_in'); }}
                          className="rounded-lg p-1.5 hover:bg-green-50 transition-colors" title="Add stock">
                          <ArrowDown className="h-3.5 w-3.5" style={{ color: GREEN }} />
                        </button>
                        <button onClick={() => { setTxnItem(item); setTxnType('stock_out'); }}
                          className="rounded-lg p-1.5 hover:bg-red-50 transition-colors" title="Use/remove stock">
                          <ArrowUp className="h-3.5 w-3.5" style={{ color: RED }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction modal */}
      {txnItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">
              {txnType === 'stock_in' ? 'Add Stock' : 'Remove Stock'} — {txnItem.name}
            </h2>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Quantity ({txnItem.unit})</label>
              <input type="number" min="0.001" step="any" value={txnQty} onChange={(e) => setTxnQty(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Notes (optional)</label>
              <input type="text" value={txnNotes} onChange={(e) => setTxnNotes(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900" placeholder="Reason…" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setTxnItem(null); setTxnQty(''); setTxnNotes(''); }}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50">
                Cancel
              </button>
              <button onClick={handleTxn} disabled={submitting || !txnQty}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: txnType === 'stock_in' ? GREEN : RED }}>
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
