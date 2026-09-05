'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { formatDate } from '@/utils/formatters';
import type { Booking, BookingStatus } from '@/types';
import toast from 'react-hot-toast';

function statusVariant(
  status: BookingStatus
): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'no_show':
      return 'danger';
    case 'in_progress':
      return 'info';
    default:
      return 'default';
  }
}

export function UpcomingCard() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    bookingsApi
      .list({ limit: 1, status: 'confirmed' })
      .then(({ data }) => {
        setBooking(data.data[0] ?? null);
      })
      .catch(() => {
        setBooking(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    if (!booking) return;
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await bookingsApi.cancel(booking.id, 'Cancelled by customer');
      setBooking(null);
      toast.success('Appointment cancelled successfully');
    } catch {
      toast.error('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <PageSpinner />;

  if (!booking) {
    return (
      <div className="card-sku p-6">
        <h3 className="font-semibold text-base mb-4" style={{ color: '#171614' }}>
          Upcoming Appointment
        </h3>
        <EmptyState
          icon={Calendar}
          title="No upcoming appointments"
          description="You don't have any confirmed bookings yet."
          action={
            <Link
              href="/bookings/services"
              className="btn-ink inline-flex items-center justify-center rounded-xl px-5 font-semibold text-sm"
              style={{ height: '40px' }}
            >
              Book Now
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="card-sku p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-base" style={{ color: '#171614' }}>
          Upcoming Appointment
        </h3>
        <Badge variant={statusVariant(booking.status)}>
          {booking.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="space-y-2.5 mb-4">
        {/* Service name */}
        <p className="font-semibold text-base" style={{ color: '#171614' }}>
          {booking.services?.name ?? 'Appointment'}
        </p>

        {/* Technician */}
        <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
          <User className="h-4 w-4 flex-shrink-0" />
          <span>Your Technician</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{formatDate(booking.scheduled_date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{booking.scheduled_time}</span>
        </div>
      </div>

      <div
        className="h-px mb-4"
        style={{
          background: 'linear-gradient(90deg, transparent, #8b8881, transparent)',
          opacity: 0.3,
        }}
      />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/account/bookings/${booking.id}`}>
          <Button variant="secondary" size="sm">
            View
          </Button>
        </Link>
        <Link href={`/account/bookings/${booking.id}`}>
          <Button variant="ghost" size="sm">
            Reschedule
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          loading={cancelling}
          onClick={handleCancel}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
