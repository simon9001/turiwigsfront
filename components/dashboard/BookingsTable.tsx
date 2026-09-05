'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Play, CheckCircle } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import type { Booking, BookingStatus } from '@/types';

const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show',
];

interface BookingsTableProps {
  bookings: Booking[];
  onBookingUpdated: (updated: Booking) => void;
}

export function BookingsTable({ bookings, onBookingUpdated }: BookingsTableProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setBusy(id);
    try {
      const { data } = await adminApi.updateBookingStatus(id, status);
      onBookingUpdated(data.data);
      toast.success('Booking status updated');
    } catch {
      toast.error('Failed to update booking');
    } finally {
      setBusy(null);
    }
  };

  const handleStart = async (id: string) => {
    setBusy(id);
    try {
      const { data } = await adminApi.startBooking(id);
      onBookingUpdated(data.data);
      toast.success('Service started');
    } catch {
      toast.error('Could not start booking');
    } finally {
      setBusy(null);
    }
  };

  const handleComplete = async (id: string) => {
    setBusy(id);
    try {
      const { data } = await adminApi.completeBooking(id);
      onBookingUpdated(data.data);
      toast.success('Service completed — slot freed');
    } catch {
      toast.error('Could not complete booking');
    } finally {
      setBusy(null);
    }
  };

  if (!bookings.length) {
    return <p className="py-12 text-center text-sm text-neutral-400">No bookings found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/80">
            {['Booking #', 'Service', 'Date', 'Time', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className={`transition-colors hover:bg-neutral-50/60 ${busy === booking.id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-700">
                {booking.booking_number}
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {booking.services?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                {booking.scheduled_date}
              </td>
              <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                {booking.scheduled_time}
              </td>
              <td className="px-4 py-3">
                <select
                  value={booking.status}
                  onChange={(e) => updateStatus(booking.id, e.target.value as BookingStatus)}
                  className="rounded-full border-0 bg-transparent py-0.5 text-xs font-medium cursor-pointer focus:ring-0 focus:outline-none"
                >
                  {BOOKING_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button
                    onClick={() => handleStart(booking.id)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: '#2e2c28' }}
                    title="Mark as in progress"
                  >
                    <Play className="h-3 w-3" /> Start
                  </button>
                )}
                {booking.status === 'in_progress' && (
                  <button
                    onClick={() => handleComplete(booking.id)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    style={{ background: '#171614' }}
                    title="Mark as completed and free the slot"
                  >
                    <CheckCircle className="h-3 w-3" /> Done
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
