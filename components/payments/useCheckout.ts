'use client';

import { useState, useEffect } from 'react';
import { paymentsApi, type ChargeResult, type CardDetails, type CheckoutData } from '@/api/payments.api';
import { rememberPaymentContext } from '@/utils/payment-context';
import toast from 'react-hot-toast';

export type CheckoutStep =
  | 'method'   // choose Card or M-Pesa
  | 'card'     // enter card details
  | 'pin'      // card PIN challenge
  | 'otp'      // card OTP challenge
  | 'mpesa'    // confirm M-Pesa → redirects to Paystack hosted page
  | 'success'
  | 'failed';

interface CheckoutState {
  step: CheckoutStep;
  reference: string | null;
  orderId: string | null;
  loading: boolean;
  error: string | null;
  displayText: string | null;
}

export function useCheckout(
  opts: {
    checkoutData?: CheckoutData;
    orderId?: string;
    bookingId?: string;
  },
  onSuccess?: (reference: string, orderId?: string) => void
) {
  const [state, setState] = useState<CheckoutState>({
    step: 'method',
    reference: null,
    orderId: opts.orderId ?? null,
    loading: false,
    error: null,
    displayText: null,
  });

  // Keep effect for any future cleanup
  useEffect(() => { return () => {}; }, []);

  function handleChargeResult(result: ChargeResult) {
    setState((s) => ({
      ...s,
      reference: result.reference,
      orderId: result.orderId ?? s.orderId,
      loading: false,
      error: null,
    }));

    switch (result.status) {
      case 'success':
        setState((s) => ({ ...s, step: 'success' }));
        onSuccess?.(result.reference, result.orderId);
        break;
      case 'send_pin':
        setState((s) => ({ ...s, step: 'pin', displayText: result.displayText ?? null }));
        break;
      case 'send_otp':
        setState((s) => ({ ...s, step: 'otp', displayText: result.displayText ?? null }));
        break;
      case 'open_url':
        if (result.redirectUrl) window.location.href = result.redirectUrl;
        break;
      case 'failed':
        setState((s) => ({ ...s, step: 'failed', error: result.message ?? 'Payment failed' }));
        break;
    }
  }

  // ── Card ──────────────────────────────────────────────────────────────────

  async function submitCard(card: CardDetails) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await paymentsApi.charge({
        card,
        orderId: opts.orderId,
        bookingId: opts.bookingId,
        checkout: opts.checkoutData,
      });
      handleChargeResult(data.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Payment failed. Please check your card details.';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }

  async function submitPin(pin: string) {
    if (!state.reference) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await paymentsApi.submitPin(state.reference, pin);
      handleChargeResult(data.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Incorrect PIN. Please try again.';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }

  async function submitOtp(otp: string) {
    if (!state.reference) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await paymentsApi.submitOtp(state.reference, otp);
      handleChargeResult(data.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Incorrect OTP. Please try again.';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }

  // ── M-Pesa (Paystack hosted page — most reliable) ────────────────────────

  async function submitMpesa() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await paymentsApi.initialize({
        orderId: opts.orderId,
        bookingId: opts.bookingId,
        checkout: opts.checkoutData,
      });
      const { authorizationUrl, reference } = data.data;

      if (authorizationUrl) {
        // Redirect to Paystack's hosted page — handles M-Pesa STK push natively.
        // Stash the context first; the navigation clears in-memory state.
        rememberPaymentContext({ bookingId: opts.bookingId, reference });
        window.location.href = authorizationUrl;
        return;
      }

      // Reused pending transaction — just verify it
      const verify = await paymentsApi.verify(reference);
      if (verify.data.data.verified) {
        setState((s) => ({ ...s, step: 'success', loading: false }));
        onSuccess?.(reference);
      } else {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Payment not yet confirmed. Please complete it and try again.',
        }));
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not initiate M-Pesa payment. Please try again.';
      setState((s) => ({ ...s, loading: false, error: msg }));
      toast.error(msg);
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function selectMethod(method: 'card' | 'mpesa') {
    setState((s) => ({ ...s, step: method, error: null }));
  }

  function retry() {
    setState({ step: 'method', reference: null, orderId: opts.orderId ?? null, loading: false, error: null, displayText: null });
  }

  return {
    ...state,
    selectMethod,
    submitCard,
    submitPin,
    submitOtp,
    submitMpesa,
    retry,
  };
}
