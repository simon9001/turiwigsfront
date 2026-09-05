'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import { formatDate, formatPrice } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { PayButton } from '@/components/payments/PayButton';
import toast from 'react-hot-toast';
import type { Booking } from '@/types';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning', confirmed: 'info', in_progress: 'info',
  completed: 'success', cancelled: 'danger', no_show: 'danger',
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.get(id).then(({ data }) => setBooking(data.data)).catch(() => toast.error('Could not load this booking'))
                                                                 .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingsApi.cancel(id, 'Cancelled by customer');
      toast.success('Booking cancelled');
      router.push('/account/bookings');
    } catch { toast.error('Could not cancel booking'); }
  };

  if (loading) return <PageSpinner />;
  if (!booking) return <div className="p-10 text-center text-neutral-500">Booking not found</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/account/bookings" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>

      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{booking.booking_number}</h1>
            <p className="text-sm text-neutral-600 mt-1">{booking.services?.name}</p>
          </div>
          <Badge variant={statusVariant[booking.status] ?? 'default'} className="text-sm px-3 py-1">{booking.status}</Badge>
        </div>

        <div className="rounded-2xl border border-neutral-200 p-5 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-neutral-700">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span>{formatDate(booking.scheduled_date)} at {booking.scheduled_time}</span>
          </div>
          {booking.services?.duration_minutes && (
            <div className="flex items-center gap-3 text-neutral-700">
              <Clock className="h-4 w-4 text-neutral-400" />
              <span>Duration: {booking.services.duration_minutes} minutes</span>
            </div>
          )}
          {booking.notes && <p className="text-neutral-500 italic">&ldquo;{booking.notes}&rdquo;</p>}
          <div className="border-t border-neutral-100 pt-3 flex justify-between font-semibold text-neutral-900">
            <span>Amount</span><span>{formatPrice(booking.price)}</span>
          </div>
        </div>

        {booking.status === 'pending' && (
          <>
            <PayButton bookingId={booking.id} amount={booking.price} amountFormatted={formatPrice(booking.price)} label="Pay for Booking" onSuccess={() => { toast.success('Payment received!'); router.push('/payment/success'); }} />
            <button onClick={handleCancel} className="w-full text-sm text-red-500 hover:text-red-700 text-center py-2 transition-colors">
              Cancel Booking
            </button>
          </>
        )}
      </div>
    </div>
  );
}
