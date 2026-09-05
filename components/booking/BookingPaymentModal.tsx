'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X, Lock, Smartphone, CreditCard,
  Loader2, CheckCircle2, AlertCircle, ChevronLeft,
} from 'lucide-react';
import { paymentsApi } from '@/api/payments.api';
import { formatPrice } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayMethod = 'mpesa' | 'card';
type Step = 'form' | 'mpesa_waiting' | 'card_pin' | 'card_otp' | 'success' | 'failed';

export interface BookingPaymentModalProps {
  bookingId: string;
  bookingNumber: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  totalPrice: number;
  depositAmount: number;
  balanceAmount: number;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-KE', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function apiError(err: unknown) {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    ?? (err as Error)?.message
    ?? 'Something went wrong. Please try again.';
}

// ─── Input component ──────────────────────────────────────────────────────────

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: '#171614' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border text-sm px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-yellow-300';
const inputStyle = { background: '#fff', borderColor: '#dedcd7', color: '#171614' };

// ─── Modal ────────────────────────────────────────────────────────────────────

export function BookingPaymentModal({
  bookingId, bookingNumber, serviceName,
  scheduledDate, scheduledTime,
  totalPrice, depositAmount, balanceAmount,
  onClose,
}: BookingPaymentModalProps) {
  const router = useRouter();

  // General
  const [payMethod, setPayMethod] = useState<PayMethod>('mpesa');
  const [step, setStep] = useState<Step>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // M-Pesa
  const [phone, setPhone] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // OTP / PIN
  const [pinValue, setPinValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [currentRef, setCurrentRef] = useState('');

  // M-Pesa poll interval
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Shared outcome handlers ──────────────────────────────────────────────

  const onSuccess = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setStep('success');
    toast.success('Payment confirmed! Your booking is now active.');
    setTimeout(() => router.push(`/account/bookings/${bookingId}`), 2500);
  };

  const onFail = (msg: string) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setError(msg);
    setStep('failed');
  };

  // ── M-Pesa ───────────────────────────────────────────────────────────────

  const payMpesa = async () => {
    setBusy(true);
    setError('');
    try {
      const { data: res } = await paymentsApi.chargeMpesa({ phone, bookingId });
      const r = res.data;

      if (r.status === 'success') { onSuccess(); return; }

      if (r.status === 'pending' || r.status === 'pay_offline') {
        setCurrentRef(r.reference);
        setStep('mpesa_waiting');
        setBusy(false);

        // Poll every 5 s, timeout after 90 s
        let polls = 0;
        pollRef.current = setInterval(async () => {
          if (++polls > 18) { onFail('Payment timed out. Please try again.'); return; }
          try {
            const { data: s } = await paymentsApi.checkMpesaStatus(r.reference);
            if (s.data.status === 'success') onSuccess();
            else if (s.data.status === 'failed') onFail('M-Pesa payment was not completed.');
          } catch { /* network error — keep polling */ }
        }, 5000);
        return;
      }

      onFail(r.displayText ?? 'M-Pesa payment failed. Please try again.');
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  // ── Card ─────────────────────────────────────────────────────────────────

  const payCard = async () => {
    setBusy(true);
    setError('');
    const digits = cardNumber.replace(/\s/g, '');
    const [mm, yy] = cardExpiry.split('/');
    try {
      const { data: res } = await paymentsApi.charge({
        bookingId,
        card: {
          number: digits,
          cvv: cardCvv,
          expiryMonth: mm ?? '',
          expiryYear: yy ? (yy.length === 2 ? `20${yy}` : yy) : '',
        },
      });
      const r = res.data;
      setCurrentRef(r.reference);

      if (r.status === 'success')   { onSuccess(); return; }
      if (r.status === 'send_pin')  { setStep('card_pin'); setBusy(false); return; }
      if (r.status === 'send_otp')  { setStep('card_otp'); setBusy(false); return; }
      onFail(r.displayText ?? r.message ?? 'Card payment failed.');
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  const submitPin = async () => {
    setBusy(true);
    setError('');
    try {
      const { data: res } = await paymentsApi.submitPin(currentRef, pinValue);
      const r = res.data;
      if (r.reference) setCurrentRef(r.reference);
      if (r.status === 'success')   { onSuccess(); return; }
      if (r.status === 'send_otp')  { setStep('card_otp'); setBusy(false); return; }
      onFail(r.displayText ?? 'PIN verification failed.');
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  const submitOtp = async () => {
    setBusy(true);
    setError('');
    try {
      const { data: res } = await paymentsApi.submitOtp(currentRef, otpValue);
      const r = res.data;
      if (r.status === 'success') { onSuccess(); return; }
      onFail(r.displayText ?? 'OTP verification failed.');
    } catch (err) {
      setError(apiError(err));
      setBusy(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const phoneDigits = phone.replace(/\D/g, '');
  const canPayMpesa = phoneDigits.length >= 9 && !busy;
  const canPayCard  =
    cardNumber.replace(/\s/g, '').length === 16 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3 &&
    !busy;

  const stepTitle: Record<Step, string> = {
    form:          'Confirm & Pay',
    mpesa_waiting: 'Waiting for payment',
    card_pin:      'Enter Card PIN',
    card_otp:      'Enter OTP',
    success:       'Confirmed',
    failed:        'Payment Failed',
  };

  const canClose = step === 'form' && !busy;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: '#f4f4f2' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
          style={{ borderColor: '#e9e8e4' }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#8b8881' }}>
              {stepTitle[step]}
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: '#171614' }}>
              Booking #{bookingNumber}
            </p>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          )}
          {(step === 'card_pin' || step === 'card_otp') && !busy && (
            <button
              onClick={() => { setStep('form'); setError(''); setPinValue(''); setOtpValue(''); }}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-400" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4 max-h-[82vh] overflow-y-auto">

          {/* Price summary — always shown */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#e9e8e4' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: '#171614' }}>{serviceName}</p>
              <p className="text-xs mt-0.5" style={{ color: '#8b8881' }}>
                {fmtDate(scheduledDate)} &middot; {fmtTime(scheduledTime)}
              </p>
            </div>
            <div className="border-t pt-3 space-y-1.5" style={{ borderColor: '#dedcd7' }}>
              <div className="flex justify-between text-xs" style={{ color: '#8b8881' }}>
                <span>Service total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: '#171614' }}>
                  Deposit due now{' '}
                  <span className="text-xs font-normal" style={{ color: '#8b8881' }}>(30%)</span>
                </span>
                <span className="text-lg font-bold" style={{ color: '#8b8881' }}>
                  {formatPrice(depositAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: '#8b8881' }}>
                <span>Balance payable at salon</span>
                <span>{formatPrice(balanceAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── FORM ─────────────────────────────────────────────────────── */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Method tabs */}
              <div
                className="grid grid-cols-2 rounded-2xl p-1 gap-1"
                style={{ background: '#e9e8e4' }}
              >
                {(['mpesa', 'card'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setPayMethod(m); setError(''); }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all"
                    style={
                      payMethod === m
                        ? { background: '#171614', color: '#fff' }
                        : { color: '#8b8881' }
                    }
                  >
                    {m === 'mpesa'
                      ? <><Smartphone className="h-4 w-4" />M-Pesa</>
                      : <><CreditCard className="h-4 w-4" />Card</>}
                  </button>
                ))}
              </div>

              {/* M-Pesa fields */}
              {payMethod === 'mpesa' && (
                <Field label="M-Pesa Phone Number">
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none"
                      style={{ color: '#8b8881' }}
                    >
                      🇰🇪 +254
                    </span>
                    <input
                      type="tel"
                      placeholder="712 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputCls}
                      style={{ ...inputStyle, paddingLeft: '84px' }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: '#8b8881' }}>
                    You&apos;ll receive an STK push — enter your M-Pesa PIN on your phone
                  </p>
                </Field>
              )}

              {/* Card fields */}
              {payMethod === 'card' && (
                <div className="space-y-3">
                  <Field label="Card Number">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(fmtCardNumber(e.target.value))}
                      className={`${inputCls} font-mono tracking-widest`}
                      style={inputStyle}
                      maxLength={19}
                      autoComplete="cc-number"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(fmtExpiry(e.target.value))}
                        className={`${inputCls} font-mono`}
                        style={inputStyle}
                        maxLength={5}
                        autoComplete="cc-exp"
                      />
                    </Field>
                    <Field label="CVV">
                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`${inputCls} font-mono`}
                        style={inputStyle}
                        maxLength={4}
                        autoComplete="cc-csc"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 text-center">{error}</p>
              )}

              <Button
                fullWidth
                size="lg"
                loading={busy}
                disabled={payMethod === 'mpesa' ? !canPayMpesa : !canPayCard}
                onClick={payMethod === 'mpesa' ? payMpesa : payCard}
                style={{ background: '#171614', color: '#fff', border: 'none' }}
              >
                {busy
                  ? 'Processing…'
                  : `Pay ${formatPrice(depositAmount)} via ${payMethod === 'mpesa' ? 'M-Pesa' : 'Card'}`}
              </Button>

              <div className="flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" style={{ color: '#8b8881' }} />
                <p className="text-xs" style={{ color: '#8b8881' }}>
                  Secured by Paystack · 256-bit encryption
                </p>
              </div>
            </div>
          )}

          {/* ── M-PESA WAITING ───────────────────────────────────────────── */}
          {step === 'mpesa_waiting' && (
            <div className="text-center space-y-5 py-4">
              <div
                className="mx-auto h-16 w-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: '#e9e8e4' }}
              >
                📱
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base" style={{ color: '#171614' }}>
                  Check your phone
                </p>
                <p className="text-sm" style={{ color: '#6e6b65' }}>
                  An M-Pesa prompt has been sent to{' '}
                  <span className="font-semibold text-neutral-800">{phone}</span>.
                  Enter your M-Pesa PIN to complete the payment.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#8b8881' }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for confirmation…
              </div>
              <button
                className="text-xs underline"
                style={{ color: '#8b8881' }}
                onClick={() => {
                  if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                  setStep('form');
                  setError('');
                }}
              >
                Didn&apos;t receive prompt? Go back and retry
              </button>
            </div>
          )}

          {/* ── CARD PIN ─────────────────────────────────────────────────── */}
          {step === 'card_pin' && (
            <div className="space-y-4">
              <p className="text-sm text-center" style={{ color: '#6e6b65' }}>
                Your bank requires your card PIN to authorise this payment.
              </p>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${inputCls} text-center font-mono`}
                style={{ ...inputStyle, letterSpacing: '0.5em' }}
                maxLength={6}
              />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 text-center">{error}</p>
              )}
              <Button
                fullWidth
                size="lg"
                loading={busy}
                disabled={pinValue.length < 4 || busy}
                onClick={submitPin}
                style={{ background: '#171614', color: '#fff', border: 'none' }}
              >
                {busy ? 'Verifying…' : 'Confirm PIN'}
              </Button>
            </div>
          )}

          {/* ── CARD OTP ─────────────────────────────────────────────────── */}
          {step === 'card_otp' && (
            <div className="space-y-4">
              <p className="text-sm text-center" style={{ color: '#6e6b65' }}>
                An OTP has been sent to your phone or email. Enter it below.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`${inputCls} text-center font-mono`}
                style={{ ...inputStyle, letterSpacing: '0.5em' }}
                maxLength={8}
              />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 text-center">{error}</p>
              )}
              <Button
                fullWidth
                size="lg"
                loading={busy}
                disabled={otpValue.length < 4 || busy}
                onClick={submitOtp}
                style={{ background: '#171614', color: '#fff', border: 'none' }}
              >
                {busy ? 'Verifying…' : 'Confirm OTP'}
              </Button>
            </div>
          )}

          {/* ── SUCCESS ──────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <CheckCircle2 className="h-14 w-14" style={{ color: '#55534e' }} />
              </div>
              <p className="font-bold text-xl" style={{ color: '#171614' }}>Booking Confirmed!</p>
              <p className="text-sm" style={{ color: '#6e6b65' }}>
                Deposit of {formatPrice(depositAmount)} received. Redirecting…
              </p>
            </div>
          )}

          {/* ── FAILED ───────────────────────────────────────────────────── */}
          {step === 'failed' && (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <AlertCircle className="h-14 w-14 text-red-400" />
              </div>
              <p className="font-bold text-lg text-red-600">Payment Failed</p>
              {error && <p className="text-sm text-neutral-500">{error}</p>}
              <Button
                fullWidth
                variant="secondary"
                onClick={() => { setStep('form'); setError(''); setBusy(false); }}
              >
                Try Again
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
