'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/api/notifications.api';
import { timeAgo } from '@/utils/formatters';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list().then(({ data }) => setItems(data.data)).catch(() => toast.error('Could not load your notifications'))
                                                                   .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
        {items.some((n) => !n.read_at) && (
          <button onClick={async () => { await notificationsApi.markAllRead(); setItems((p) => p.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))); }}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {!items.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => !n.read_at && markRead(n.id)}
              className={cn('w-full text-left rounded-2xl border p-4 transition-all', n.read_at ? 'border-neutral-100 bg-white' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400')}>
              <div className="flex items-start gap-3">
                {!n.read_at && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-black" />}
                <div className={cn('flex-1', n.read_at && 'pl-5')}>
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-neutral-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
