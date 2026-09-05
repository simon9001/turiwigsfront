'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi } from '@/api/payments.api';
import { rememberPaymentContext } from '@/utils/payment-context';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface PaystackButtonProps {
  orderId?: string;
  bookingId?: string;
  label?: string;
  onSuccess?: (reference: string) => void;
}

export function PaystackButton({
  orderId,
  bookingId,
  label = 'Pay Now',
  onSuccess,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.initialize({ orderId, bookingId });
      const { authorizationUrl, reference } = data.data;

      if (authorizationUrl) {
        // Redirect to Paystack hosted page. Stash what this payment is for
        // first — the navigation clears every bit of in-memory state.
        rememberPaymentContext({ bookingId, reference });
        window.location.href = authorizationUrl;
      } else {
        // Already pending — verify
        const verify = await paymentsApi.verify(reference);
        if (verify.data.data.verified) {
          onSuccess?.(reference);
          router.push(`/payment/success?reference=${reference}`);
        } else {
          toast.error('Payment could not be verified. Please try again.');
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Payment initialisation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePay} loading={loading} fullWidth size="lg">
      {label}
    </Button>
  );
}
