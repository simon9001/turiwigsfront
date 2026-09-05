'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarPlus, ListOrdered, CheckCircle2, Navigation } from 'lucide-react';

const PARLOUR_ADDRESS = 'Tiuri Nails & Wigs Parlour, Jewel Complex, Room 220, 2nd Floor TRM Drive, Nairobi';
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Tiuri+Nails+%26+Wigs+Parlour,+Jewel+Complex,+Room+220,+2nd+Floor+TRM+Dr,+Nairobi';
import { bookingsApi } from '@/api/bookings.api';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectWizard } from '@/store/slices/booking-wizard.slice';
import { PayButton } from '@/components/payments/PayButton';
import { formatPrice, formatDate } from '@/utils/formatters';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Booking } from '@/types';

function buildGoogleCalendarUrl(booking: Booking, serviceName: string): string {
  const date = booking.scheduled_date.replace(/-/g, '');
  const [hh, mm] = booking.scheduled_time.split(':').map(Number);
  const startTime = `${date}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`;
  const endHour = hh + 1;
  const endTime = `${date}T${String(endHour).padStart(2, '0')}${String(mm).padStart(2, '0')}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${serviceName} - Tiuri Nails & Wigs`,
    dates: `${startTime}/${endTime}`,
    details: `Booking #${booking.booking_number}\n${PARLOUR_ADDRESS}`,
    location: PARLOUR_ADDRESS,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function ConfirmationPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const wizard = useAppSelector(selectWizard);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    bookingsApi
      .get(id)
      .then(({ data }) => setBooking(data.data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;

  const serviceName = booking?.services?.name ?? wizard.service?.name ?? 'Appointment';
  const servicePrice = wizard.service?.price ?? booking?.price ?? 0;
  const depositAmount = Math.round(servicePrice * 0.3);
  const remaining = servicePrice - depositAmount;

  return (
    <div className="min-h-screen" style={{ background: '#fff' }}>
      <div className="max-w-md mx-auto">
        {/* Dark green header */}
        <div
          className="px-6 pt-10 pb-8 text-center relative overflow-hidden"
          style={{
            background: '#171614',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
              top: '-40px',
            }}
          />

          {/* Checkmark animation */}
          <div className="relative z-10 flex justify-center mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: '#171614',
                animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: '#ffffff' }} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 relative z-10">
            Booking Confirmed!
          </h1>
          <p className="text-sm relative z-10" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Your appointment has been reserved
          </p>

          {/* Booking number */}
          <div
            className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(23,22,20,0.35)',
            }}
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Booking #
            </span>
            <span
              className="font-bold text-base tracking-widest"
              style={{ color: '#ffffff' }}
            >
              {booking?.booking_number ?? wizard.createdBookingNumber ?? '—'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-6 space-y-4">
          {/* Service info */}
          <div className="card-sku p-4">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#8b8881' }}>
              Appointment Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8b8881' }}>Service</span>
                <span className="font-semibold" style={{ color: '#171614' }}>
                  {serviceName}
                </span>
              </div>
              {booking?.scheduled_date && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#8b8881' }}>Date</span>
                  <span className="font-medium" style={{ color: '#171614' }}>
                    {formatDate(booking.scheduled_date)}
                  </span>
                </div>
              )}
              {booking?.scheduled_time && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#8b8881' }}>Time</span>
                  <span className="font-medium" style={{ color: '#171614' }}>
                    {booking.scheduled_time}
                  </span>
                </div>
              )}
              {wizard.technician && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#8b8881' }}>Technician</span>
                  <span className="font-medium" style={{ color: '#171614' }}>
                    {wizard.technician.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8b8881' }}>Location</span>
                <span className="font-medium text-right" style={{ color: '#171614', maxWidth: '200px' }}>
                  {PARLOUR_ADDRESS}
                </span>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="card-sku p-4">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#8b8881' }}>
              Payment Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8b8881' }}>Service Price</span>
                <span className="font-medium" style={{ color: '#171614' }}>
                  {formatPrice(servicePrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8b8881' }}>Deposit Paid (30%)</span>
                <span className="font-semibold" style={{ color: '#55534e' }}>
                  {formatPrice(depositAmount)}
                </span>
              </div>
              <div className="rule my-1" />
              <div className="flex justify-between text-sm">
                <span style={{ color: '#8b8881' }}>Balance Due at Appointment</span>
                <span className="font-semibold" style={{ color: '#8b8881' }}>
                  {formatPrice(remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-[120px] h-[120px] rounded-xl flex flex-col items-center justify-center"
              style={{ background: '#171614' }}
            >
              <span className="text-lg font-bold" style={{ color: '#ffffff' }}>
                QR
              </span>
              <span
                className="text-xs text-center px-2 mt-1"
                style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', lineHeight: 1.3 }}
              >
                {booking?.booking_number ?? wizard.createdBookingNumber ?? '—'}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#8b8881' }}>
              Show at salon for check-in
            </p>
          </div>

          {/* Pay deposit button if pending */}
          {booking?.status === 'pending' && (
            <PayButton
              bookingId={booking.id}
              amount={depositAmount}
              amountFormatted={formatPrice(depositAmount)}
              description={`Deposit for ${serviceName}`}
              label="Pay Deposit Now"
            />
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            {booking && (
              <a
                href={buildGoogleCalendarUrl(booking, serviceName)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl h-11 text-sm font-semibold"
                style={{
                  background: '#fff',
                  border: '1px solid #dedcd7',
                  color: '#55534e',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <CalendarPlus className="h-4 w-4" />
                Add to Cal
              </a>
            )}

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl h-11 text-sm font-semibold"
              style={{
                background: '#171614',
                color: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Navigation className="h-4 w-4" />
              Get Directions
            </a>
          </div>

          <Link
            href="/account/bookings"
            className="flex items-center justify-center gap-2 w-full rounded-xl h-11 text-sm font-semibold"
            style={{
              background: '#171614',
              color: '#ffffff',
            }}
          >
            <ListOrdered className="h-4 w-4" />
            View My Bookings
          </Link>
        </div>
      </div>

      {/* Bounce-in animation */}
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
