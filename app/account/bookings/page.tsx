'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import { formatDate, formatPrice } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Booking } from '@/types';
import toast from 'react-hot-toast';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', in_progress: 'info',
  completed: 'success', cancelled: 'danger', no_show: 'danger',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.list().then(({ data }) => setBookings(data.data)).catch(() => toast.error('Could not load your bookings'))
                                                                 .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">My Bookings</h1>
        <Link href="/services"><Button variant="secondary" size="sm">Book a Service</Button></Link>
      </div>
      {!bookings.length ? (
        <EmptyState icon={Calendar} title="No bookings yet" description="Book a wig service to get started."
          action={<Link href="/services"><Button>View Services</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b.id} href={`/account/bookings/${b.id}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-200 p-5 hover:border-neutral-400 hover:bg-neutral-50 transition-all">
              <div className="space-y-1">
                <p className="font-semibold text-neutral-900">{b.booking_number}</p>
                <p className="text-sm text-neutral-600">{b.services?.name}</p>
                <p className="text-xs text-neutral-400">{formatDate(b.scheduled_date)} at {b.scheduled_time}</p>
                <Badge variant={statusVariant[b.status] ?? 'default'}>{b.status}</Badge>
              </div>
              <p className="text-base font-bold text-neutral-900">{formatPrice(b.price)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
