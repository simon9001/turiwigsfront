'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const savedBookingId = sessionStorage.getItem('pg_booking_id');
    if (savedBookingId) {
      // sessionStorage is browser-only, so this has to be read after mount.
      // Seeding it with a lazy initialiser instead would make the server and
      // client first render disagree and produce a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBooking(true);
      // Clean up
      sessionStorage.removeItem('pg_booking_id');
      sessionStorage.removeItem('pg_booking_number');
      sessionStorage.removeItem('pg_reference');
    }
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payment Failed</h1>
          <p className="mt-2 text-neutral-500 text-sm">
            Something went wrong with your payment. No money was charged.
          </p>
          {reference && (
            <p className="mt-2 text-xs font-mono text-neutral-400">Ref: {reference}</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {isBooking ? (
            <>
              <Link href="/services">
                <Button
                  fullWidth
                  style={{ background: '#171614', color: '#fff', border: 'none' }}
                >
                  Try Booking Again
                </Button>
              </Link>
              <Link href="/account/bookings">
                <Button fullWidth variant="secondary">My Bookings</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/checkout">
                <Button fullWidth>Try Again</Button>
              </Link>
              <Link href="/cart">
                <Button fullWidth variant="secondary">Back to Cart</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense>
      <PaymentFailedContent />
    </Suspense>
  );
}
