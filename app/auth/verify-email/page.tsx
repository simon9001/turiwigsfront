'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MailCheck, RefreshCw } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setSession } from '@/store/slices/auth.slice';
import toast from 'react-hot-toast';

// ─── Inner component (needs Suspense because it calls useSearchParams) ────────

function VerifyEmailForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const email = params.get('email') ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  const otp = digits.join('');

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError('');
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Please enter the full 6-digit code'); return; }
    if (!email) { setError('Email missing — please register again'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await authApi.verifyOtp(email, otp);
      if (data.data.session) {
        dispatch(setSession(data.data.session));
        toast.success('Welcome to Tiuri! Your account is now active.');
        router.push('/');
      } else {
        // Email verified but auto-login unavailable — profile exists, just sign in
        toast.success('Email verified! Please sign in to continue.');
        router.push('/auth/login');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Invalid or expired code. Please try again.';
      setError(msg);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    try {
      await authApi.resendVerification(email);
      toast.success('New code sent — check your inbox.');
      startCooldown();
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      toast.error('Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <div className="mb-5 flex justify-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{
              background: '#171614',
              boxShadow: '0 4px 16px rgba(23,22,20,0.25)',
            }}
          >
            <MailCheck className="h-8 w-8" style={{ color: '#ffffff' }} />
          </div>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#171614' }}>Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#6e6b65' }}>
          We sent a 6-digit code to
          {email
            ? <><br /><span className="font-semibold" style={{ color: '#171614' }}>{email}</span></>
            : ' your email address'}.
        </p>
      </div>

      {/* 6-digit boxes */}
      <div>
        <p className="text-xs font-semibold mb-3 text-center uppercase tracking-widest" style={{ color: '#8b8881' }}>
          Verification code
        </p>
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-11 rounded-xl text-center text-xl font-bold outline-none transition-all"
              style={{
                background: '#fff',
                border: error
                  ? '2px solid #ef4444'
                  : digit
                    ? '2px solid #8b8881'
                    : '1.5px solid #dedcd7',
                color: '#171614',
                boxShadow: digit ? '0 0 0 3px rgba(23,22,20,0.12)' : undefined,
              }}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={submitting}
        disabled={otp.length < 6}
        variant="secondary"
        style={{
          background: otp.length === 6 ? '#171614' : undefined,
          border: '1px solid rgba(23,22,20,0.6)',
          color: otp.length === 6 ? '#ffffff' : '#6e6b65',
          boxShadow: otp.length === 6
            ? '0 1px 0 rgba(255,255,255,0.08) inset,0 4px 12px rgba(23,22,20,0.35)'
            : undefined,
        }}
      >
        Verify Email
      </Button>

      {/* Resend */}
      <div className="text-center space-y-1">
        <p className="text-sm" style={{ color: '#6e6b65' }}>Didn&apos;t receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !email}
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: cooldown > 0 ? '#8b8881' : '#171614' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>

      <div className="text-center text-sm space-y-1.5">
        <p>
          <Link href="/auth/login" style={{ color: '#171614' }} className="hover:underline">
            ← Back to sign in
          </Link>
        </p>
        <p style={{ color: '#8b8881' }}>
          Wrong email?{' '}
          <Link href="/auth/register" style={{ color: '#171614' }} className="font-semibold hover:underline">
            Sign up again
          </Link>
        </p>
      </div>
    </form>
  );
}

// ─── Page (Suspense required by Next.js 14 for useSearchParams) ───────────────

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-1">
      {/* Left: form */}
      <div
        className="relative flex w-full flex-col justify-center overflow-y-auto px-6 py-16 lg:w-[480px] lg:flex-shrink-0 xl:w-[520px]"
        style={{ background: '#f4f4f2' }}
      >
        <div className="mx-auto w-full max-w-sm">
          <Suspense fallback={
            <div className="flex items-center justify-center h-40">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#c9c6bf', borderTopColor: 'transparent' }} />
            </div>
          }>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>

      {/* Right: image (desktop only) */}
      <div
        className="hidden lg:block flex-1"
        style={{
          position: 'sticky',
          top: '64px',
          height: 'calc(100dvh - 64px)',
          alignSelf: 'flex-start',
          background: '#f4f4f2',
          padding: '16px 16px 16px 0',
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-3xl">
          <Image
            src="/images/auth-register.jpeg"
            alt="Tiuri Nails & Wigs salon"
            fill
            className="object-cover"
            sizes="50vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(23,22,20,0.15) 55%, rgba(23,22,20,0.55) 100%)' }}
          />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Almost there
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug">
              One step<br />to go.
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Enter the code we emailed you to activate your account.
            </p>
            <div className="mt-4 h-0.5 w-16 rounded-full" style={{ background: '#171614' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
