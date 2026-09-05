'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OtpStepProps {
  onSubmit: (otp: string) => void;
  loading: boolean;
  error: string | null;
  displayText?: string | null;
}

const OTP_LENGTH = 6;

export function OtpStep({ onSubmit, loading, error, displayText }: OtpStepProps) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...otp];
      digits.forEach((d, i) => { if (index + i < OTP_LENGTH) next[index + i] = d; });
      setOtp(next);
      inputs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = otp.join('');
    if (full.length === OTP_LENGTH) onSubmit(full);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <MessageSquare className="h-6 w-6 text-neutral-700" />
        </div>
        <h3 className="text-base font-semibold text-neutral-900">Enter OTP</h3>
        <p className="mt-1 text-sm text-neutral-500">
          {displayText ?? 'A one-time password was sent to your registered phone number.'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-11 rounded-xl border-2 border-neutral-200 bg-white text-center text-lg font-bold text-neutral-900 outline-none focus:border-neutral-900 transition-colors"
          />
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 text-center">{error}</p>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        disabled={otp.join('').length < OTP_LENGTH}
      >
        Verify OTP
      </Button>
    </form>
  );
}
