'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { adminApi } from '@/api/admin.api';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import type { Order, OrderStatus } from '@/types';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import toast from 'react-hot-toast';

const STATUS_FILTERS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const limit = 15;
  // `search` is what is typed; `query` is what has been submitted. Only the
  // submitted value drives a request, so typing does not refetch.
  const [query, setQuery] = useState('');

  // Rapid paging can leave two requests in flight; only the newest one is
  // allowed to write its results.
  const reqId = useRef(0);

  const fetch = useCallback(() => {
    const id = ++reqId.current;
    return adminApi.listOrders({
      page, limit,
      search: query || undefined,
      status: statusFilter || undefined,
    })
      .then(({ data }) => {
        if (id !== reqId.current) return;   // superseded
        setOrders(data.data);
        setTotal(data.meta.total);
      })
      .catch(() => { if (id === reqId.current) toast.error('Could not load orders'); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [page, query, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useRealtimeRefresh(['orders'], fetch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Nothing to fetch if the term and the page are both unchanged — without
    // this the spinner would be switched on with no request to switch it off.
    if (search === query && page === 1) return;
    setQuery(search);
    setPage(1);
    setLoading(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
              // Re-clicking the active filter changes nothing, so there would
              // be no refetch to turn the spinner back off.
              if (f.value === statusFilter) return;
              setStatusFilter(f.value); setPage(1); setLoading(true);
            }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}
              style={statusFilter === f.value ? { background: '#171614' } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 sm:w-64">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #…"
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/25"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Go</Button>
        </form>
      </div>

      {loading ? <PageSpinner /> : (
        <>
          <OrdersTable
            orders={orders}
            basePath="/admin/orders"
            canManagePayments
            onOrderUpdated={(updated) =>
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            }
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => { setLoading(true); setPage((p) => p - 1); }}>
                Previous
              </Button>
              <span className="text-sm text-neutral-400">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => { setLoading(true); setPage((p) => p + 1); }}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
