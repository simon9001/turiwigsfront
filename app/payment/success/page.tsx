'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Navigation, Loader2 } from 'lucide-react';
import { paymentsApi } from '@/api/payments.api';
import { Button } from '@/components/ui/Button';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Tiuri+Nails+%26+Wigs+Parlour,+Jewel+Complex,+Room+220,+2nd+Floor+TRM+Dr,+Nairobi';
const PARLOUR_ADDRESS = 'Jewel Complex, Room 220, 2nd Floor, TRM Drive, Nairobi';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  const [status, setStatus] = useState<'loading' | 'done'>('loading');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Restore context from sessionStorage (set before redirect)
    const savedBookingId = sessionStorage.getItem('pg_booking_id');

    if (!reference) {
      // sessionStorage is browser-only, so this has to be read after mount.
      // Seeding it with a lazy initialiser instead would make the server and
      // client first render disagree and produce a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookingId(savedBookingId);
      setStatus('done');
      return;
    }

    paymentsApi
      .verify(reference)
      .then(({ data }) => {
        const result = data.data;
        setBookingId(result.bookingId ?? savedBookingId ?? null);
        setOrderId(result.orderId ?? null);
      })
      .catch(() => {
        // Verify failed — use sessionStorage fallback
        setBookingId(savedBookingId);
      })
      .finally(() => {
        // Clean up sessionStorage
        sessionStorage.removeItem('pg_booking_id');
        sessionStorage.removeItem('pg_booking_number');
        sessionStorage.removeItem('pg_reference');
        setStatus('done');
      });
  }, [reference]);

  const isBooking = !!bookingId;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {status === 'loading' ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#8b8881' }} />
            </div>
            <p className="text-neutral-500 text-sm">Confirming your payment…</p>
          </>
        ) : (
          <>
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: 'rgba(47,111,79,0.12)' }}
            >
              <CheckCircle className="h-10 w-10" style={{ color: '#2f6f4f' }} />
            </div>

            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#171614' }}>
                {isBooking ? 'Booking Confirmed!' : 'Payment Successful!'}
              </h1>
              <p className="mt-2 text-sm" style={{ color: '#6e6b65' }}>
                {isBooking
                  ? 'Your deposit has been received. We look forward to seeing you!'
                  : "Your payment has been confirmed. We're processing your order."}
              </p>
              {reference && (
                <p className="mt-2 text-xs font-mono text-neutral-400">Ref: {reference}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {isBooking ? (
                <>
                  <Link href={`/account/bookings/${bookingId}`}>
                    <Button
                      fullWidth
                      style={{ background: '#171614', color: '#fff', border: 'none' }}
                    >
                      View My Booking
                    </Button>
                  </Link>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90"
                    style={{
                      background: '#171614',
                      color: '#ffffff',
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions to Salon
                  </a>
                  <p className="text-xs text-neutral-400">{PARLOUR_ADDRESS}</p>
                  <Link href="/services">
                    <Button fullWidth variant="secondary">Browse Services</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href={orderId ? `/account/orders/${orderId}` : '/account/orders'}>
                    <Button fullWidth>View My Orders</Button>
                  </Link>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-90"
                    style={{
                      background: '#171614',
                      color: '#ffffff',
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions to Salon
                  </a>
                  <p className="text-xs text-neutral-400">{PARLOUR_ADDRESS}</p>
                  <Link href="/products">
                    <Button fullWidth variant="secondary">Continue Shopping</Button>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
