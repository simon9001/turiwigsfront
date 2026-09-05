'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, CheckCircle, XCircle, ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import { CardForm } from './CardForm';
import { MpesaForm } from './MpesaForm';
import { PinStep } from './PinStep';
import { OtpStep } from './OtpStep';
import { useCheckout } from './useCheckout';
import { Button } from '@/components/ui/Button';
import type { CheckoutData } from '@/api/payments.api';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  // New: checkout-first flow (order created after payment)
  checkoutData?: CheckoutData;
  // Legacy: paying against an already-created order/booking
  orderId?: string;
  bookingId?: string;
  amount: string;
  description?: string;
  onSuccess?: (reference: string, orderId?: string) => void;
}

const STEP_LABELS: Record<string, string> = {
  method: 'Choose Payment Method',
  card: 'Card Details',
  pin: 'Card PIN',
  otp: 'Verify OTP',
  mpesa: 'Pay with M-Pesa',
  success: 'Payment Successful',
  failed: 'Payment Failed',
};

export function CheckoutModal({
  open,
  onClose,
  checkoutData,
  orderId,
  bookingId,
  amount,
  description,
  onSuccess,
}: CheckoutModalProps) {
  const {
    step,
    loading,
    error,
    displayText,
    selectMethod,
    submitCard,
    submitPin,
    submitOtp,
    submitMpesa,
    retry,
  } = useCheckout({ checkoutData, orderId, bookingId }, onSuccess);

  const canGoBack = step === 'card' || step === 'mpesa' || step === 'pin' || step === 'otp';

  function handleBack() {
    if (step === 'pin' || step === 'otp') retry();
    else retry(); // returns to method selector
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={step === 'success' ? onClose : () => {}}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-4 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    {canGoBack && (
                      <button onClick={handleBack} className="rounded-xl p-1.5 hover:bg-neutral-100 transition-colors">
                        <ArrowLeft className="h-4 w-4 text-neutral-500" />
                      </button>
                    )}
                    <div>
                      <Dialog.Title className="text-sm font-semibold text-neutral-900">
                        {STEP_LABELS[step]}
                      </Dialog.Title>
                      {description && step === 'method' && (
                        <p className="text-xs text-neutral-400">{description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-xl p-1.5 hover:bg-neutral-100 transition-colors disabled:opacity-40"
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">

                  {/* ── Method selector ── */}
                  {step === 'method' && (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-neutral-50 px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-neutral-500">Amount to pay</span>
                        <span className="text-base font-bold text-neutral-900">{amount}</span>
                      </div>
                      <p className="text-sm text-neutral-500 text-center">Select how you&rsquo;d like to pay</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => selectMethod('mpesa')}
                          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-green-200 bg-green-50 p-5 hover:border-green-400 hover:bg-green-100 transition-all"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                            <Smartphone className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-green-800">M-Pesa</p>
                            <p className="text-xs text-green-600 mt-0.5">STK Push</p>
                          </div>
                        </button>
                        <button
                          onClick={() => selectMethod('card')}
                          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-5 hover:border-neutral-400 hover:bg-neutral-100 transition-all"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-neutral-900">Card</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Visa / Mastercard</p>
                          </div>
                        </button>
                      </div>
                      <p className="text-xs text-center text-neutral-400">
                        All payments secured by Paystack · 256-bit SSL
                      </p>
                    </div>
                  )}

                  {/* ── Card form ── */}
                  {step === 'card' && (
                    <CardForm
                      onSubmit={submitCard}
                      loading={loading}
                      error={error}
                      amount={amount}
                    />
                  )}

                  {/* ── Card PIN ── */}
                  {step === 'pin' && (
                    <PinStep
                      onSubmit={submitPin}
                      loading={loading}
                      error={error}
                      displayText={displayText}
                    />
                  )}

                  {/* ── Card OTP ── */}
                  {step === 'otp' && (
                    <OtpStep
                      onSubmit={submitOtp}
                      loading={loading}
                      error={error}
                      displayText={displayText}
                    />
                  )}

                  {/* ── M-Pesa → redirects to Paystack hosted page ── */}
                  {step === 'mpesa' && (
                    <MpesaForm
                      amount={amount}
                      loading={loading}
                      error={error}
                      onSubmit={submitMpesa}
                    />
                  )}

                  {/* ── Success ── */}
                  {step === 'success' && (
                    <div className="flex flex-col items-center gap-5 py-4 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900">Payment Successful!</h3>
                        <p className="mt-1.5 text-sm text-neutral-500">
                          Your payment of <strong>{amount}</strong> has been confirmed.
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2.5">
                        <Button fullWidth onClick={onClose}>
                          View My Orders
                        </Button>
                        <Button fullWidth variant="ghost" onClick={onClose}>
                          Continue Shopping
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Failed ── */}
                  {step === 'failed' && (
                    <div className="flex flex-col items-center gap-5 py-4 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900">Payment Failed</h3>
                        <p className="mt-1.5 text-sm text-neutral-500">
                          {error ?? 'Something went wrong. No money was charged.'}
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2.5">
                        <Button fullWidth onClick={retry}>Try Again</Button>
                        <Button fullWidth variant="ghost" onClick={onClose}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
