'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BookingsTable } from '@/components/dashboard/BookingsTable';
import { adminApi } from '@/api/admin.api';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import type { Booking, BookingStatus } from '@/types';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import toast from 'react-hot-toast';

const STATUS_FILTERS: { label: string; value: BookingStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const limit = 15;

  // One request per (page, filter). Resetting the page belongs to the click
  // that changes the filter, not to an effect — two effects both firing on
  // mount is what made this page request the first page twice.
  // Rapid paging can leave two requests in flight; only the newest one is
  // allowed to write its results.
  const reqId = useRef(0);

  const fetch = useCallback(() => {
    const id = ++reqId.current;
    return adminApi.listBookings({ page, limit, status: statusFilter || undefined })
      .then(({ data }) => {
        if (id !== reqId.current) return;   // superseded
        setBookings(data.data);
        setTotal(data.meta.total);
      })
      .catch(() => { if (id === reqId.current) toast.error('Could not load bookings'); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [page, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useRealtimeRefresh(['service_bookings'], fetch);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Bookings</h1>
        <p className="mt-1 text-sm text-neutral-400">Manage booking statuses for your shift.</p>
      </div>

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

      {loading ? <PageSpinner /> : (
        <>
          <BookingsTable
            bookings={bookings}
            onBookingUpdated={(updated) =>
              setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
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
