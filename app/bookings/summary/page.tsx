'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, User, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  setNotes,
  setCreatedBooking,
  selectWizard,
} from '@/store/slices/booking-wizard.slice';
import { bookingsApi } from '@/api/bookings.api';
import { formatPrice, formatDate } from '@/utils/formatters';
import { BookingStepBar } from '@/components/bookings/BookingStepBar';

export default function SummaryPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const wizard = useAppSelector(selectWizard);
  const [localNotes, setLocalNotes] = useState(wizard.notes);
  const [loading, setLoading] = useState(false);

  const depositAmount = wizard.service
    ? Math.round(wizard.service.price * 0.3)
    : 0;
  const remaining = wizard.service
    ? wizard.service.price - depositAmount
    : 0;

  async function handleConfirm() {
    if (!wizard.service || !wizard.date || !wizard.time) {
      toast.error('Missing booking details. Please start over.');
      return;
    }

    dispatch(setNotes(localNotes));
    setLoading(true);

    try {
      const { data } = await bookingsApi.create({
        serviceId: wizard.service.id,
        slotId: wizard.slotId ?? undefined,
        scheduledDate: wizard.date,
        scheduledTime: wizard.time,
        notes: localNotes || undefined,
      });

      dispatch(
        setCreatedBooking({
          id: data.data.id,
          booking_number: data.data.booking_number,
        })
      );

      toast.success('Booking confirmed!');
      router.push(`/bookings/confirmation/${data.data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Failed to create booking. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!wizard.service) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f4f2' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: '#8b8881' }}>
            No service selected.
          </p>
          <Link href="/bookings/services" className="btn-ink rounded-xl px-5 inline-flex items-center h-11 font-semibold text-sm">
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f4f2' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/bookings/schedule"
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: '#fff', border: '1px solid #dedcd7' }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: '#55534e' }} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: '#171614' }}>
            Booking Summary
          </h1>
        </div>

        <div className="mb-5 mt-3">
          <BookingStepBar currentStep={4} />
        </div>

        {/* Service card */}
        <div className="card-sku p-4 mb-4">
          <div className="flex gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={wizard.service.imageUrl}
                alt={wizard.service.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base" style={{ color: '#171614' }}>
                {wizard.service.name}
              </h3>
              <p className="text-sm" style={{ color: '#8b8881' }}>
                {wizard.service.duration_minutes} min session
              </p>
            </div>
          </div>

          <div className="rule my-3" />

          {/* Details */}
          <div className="space-y-2">
            {wizard.technician && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
                <User className="h-4 w-4 flex-shrink-0" style={{ color: '#8b8881' }} />
                <span>{wizard.technician.name} · {wizard.technician.title}</span>
              </div>
            )}
            {!wizard.technician && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
                <User className="h-4 w-4 flex-shrink-0" style={{ color: '#8b8881' }} />
                <span>Any Available Technician</span>
              </div>
            )}

            {wizard.date && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: '#8b8881' }} />
                <span>{formatDate(wizard.date)}</span>
              </div>
            )}

            {wizard.time && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#55534e' }}>
                <Clock className="h-4 w-4 flex-shrink-0" style={{ color: '#8b8881' }} />
                <span>{wizard.time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card-sku p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" style={{ color: '#8b8881' }} />
            <label
              htmlFor="notes"
              className="font-semibold text-sm"
              style={{ color: '#171614' }}
            >
              Special Requests / Notes
            </label>
          </div>
          <textarea
            id="notes"
            rows={3}
            placeholder="Any special requests or notes for your technician..."
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            className="input-sku w-full rounded-xl text-sm p-3 resize-none focus:outline-none"
            style={{ color: '#171614' }}
          />
        </div>

        {/* Price breakdown */}
        <div className="card-sku p-4 mb-4">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#171614' }}>
            Price Breakdown
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: '#8b8881' }}>Service Price</span>
              <span className="font-medium" style={{ color: '#171614' }}>
                {formatPrice(wizard.service.price)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#8b8881' }}>Deposit (30%)</span>
              <span className="font-semibold" style={{ color: '#8b8881' }}>
                {formatPrice(depositAmount)}
              </span>
            </div>
            <div className="rule my-1" />
            <div className="flex justify-between text-sm">
              <span style={{ color: '#8b8881' }}>Remaining Balance</span>
              <span className="font-medium" style={{ color: '#171614' }}>
                {formatPrice(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Cancellation policy */}
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5"
          style={{
            background: 'rgba(23,22,20,0.06)',
            border: '1px solid rgba(23,22,20,0.12)',
          }}
        >
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#55534e' }} />
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#55534e' }}>
              Free Cancellation
            </p>
            <p className="text-xs" style={{ color: '#55534e' }}>
              Cancel at least 24 hours before your appointment for a full refund.{' '}
              <Link href="/terms" className="underline" style={{ color: '#8b8881' }}>
                View terms
              </Link>
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleConfirm}
          disabled={loading || !wizard.date || !wizard.time}
          className="btn-ink w-full rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ height: '52px' }}
        >
          {loading ? 'Confirming...' : `Confirm & Pay Deposit · ${formatPrice(depositAmount)}`}
        </button>
      </div>
    </div>
  );
}
