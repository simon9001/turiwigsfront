'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Plus, Flag } from 'lucide-react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { clientNotesApi } from '@/api/erp.api';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const GOLD = '#8b8881'; const RED = '#ef4444'; type Note = { id: string; client_id: string; note: string; is_flagged: boolean; created_at: string; profiles?: { name: string }[] | null };

export default function StaffClientNotesPage() {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flaggedOnly, setFlagged] = useState(false);
  const [form, setForm] = useState({ clientId: '', note: '', isFlagged: false, bookingId: '' });

  const load = useCallback(() => {
    return clientNotesApi.listAll({ flaggedOnly: flaggedOnly ? 'true' : undefined })
      .then((res) => setNotes((res.data.data ?? []) as Note[]))
      .catch(() => { /* no notes */ })
      .finally(() => setLoading(false));
  }, [flaggedOnly]);

  useEffect(() => { load(); }, [load]);

  useRealtimeRefresh(['client_notes'], load);

  useEffect(() => {
    const id = setInterval(() => load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.note) return;
    setSubmitting(true);
    try {
      await clientNotesApi.create({ clientId: form.clientId, note: form.note, isFlagged: form.isFlagged, bookingId: form.bookingId || undefined });
      toast.success('Note saved');
      setShowAdd(false);
      setForm({ clientId: '', note: '', isFlagged: false, bookingId: '' });
      load();
    } catch { toast.error('Failed to save note'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await clientNotesApi.remove(id);
      toast.success('Note deleted');
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Client Notes</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Notes, allergies &amp; preferences per client</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: GOLD }}>
            <Plus className="h-3.5 w-3.5" /> Add Note
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 cursor-pointer">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlagged(e.target.checked)} className="accent-red-500" />
          <Flag className="h-3.5 w-3.5 text-red-500" /> Show flagged only
        </label>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center text-neutral-400">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-200" />
            <p className="text-sm text-neutral-400">No client notes yet.</p>
            <p className="text-xs text-neutral-300 mt-1">Add notes during or after services to keep track of client preferences and allergies.</p>
          </div>
        ) : notes.map((n) => {
          const clientName = Array.isArray(n.profiles) ? n.profiles[0]?.name : null;
          return (
            <div key={n.id} className="bg-white rounded-2xl border shadow-sm p-4"
              style={n.is_flagged ? { borderColor: `${RED}40`, background: `${RED}04` } : { borderColor: '#e9e8e4' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-neutral-800">{clientName ?? 'Client'}</span>
                    {n.is_flagged && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${RED}15`, color: RED }}>
                        <Flag className="h-2.5 w-2.5" /> Flagged
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400 ml-auto">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-neutral-600">{n.note}</p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-[10px] text-red-400 hover:text-red-600 flex-shrink-0">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Add Client Note</h2>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Client ID *</label>
              <input required type="text" value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                placeholder="Paste client UUID from the system" />
              <p className="text-[10px] text-neutral-400 mt-1">Find the client UUID in the Users section</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Booking ID (optional)</label>
              <input type="text" value={form.bookingId} onChange={(e) => setForm((f) => ({ ...f, bookingId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-900"
                placeholder="Link to a specific booking" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Note *</label>
              <textarea required rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 resize-none"
                placeholder="Allergies, preferences, skin conditions, special care…" />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 cursor-pointer">
              <input type="checkbox" checked={form.isFlagged} onChange={(e) => setForm((f) => ({ ...f, isFlagged: e.target.checked }))} className="accent-red-500" />
              <Flag className="h-3.5 w-3.5 text-red-500" /> Flag as important / medical condition
            </label>
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
