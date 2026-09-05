'use client';

import { useState, useRef, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PinStepProps {
  onSubmit: (pin: string) => void;
  loading: boolean;
  error: string | null;
  displayText?: string | null;
}

export function PinStep({ onSubmit, loading, error, displayText }: PinStepProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...pin];
    next[index] = value.slice(-1);
    setPin(next);
    if (value && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = pin.join('');
    if (full.length === 4) onSubmit(full);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <KeyRound className="h-6 w-6 text-neutral-700" />
        </div>
        <h3 className="text-base font-semibold text-neutral-900">Enter Your Card PIN</h3>
        <p className="mt-1 text-sm text-neutral-500">
          {displayText ?? 'Enter the 4-digit PIN for your card.'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-14 w-14 rounded-2xl border-2 border-neutral-200 bg-white text-center text-xl font-bold text-neutral-900 outline-none focus:border-neutral-900 transition-colors"
          />
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 text-center">{error}</p>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading} disabled={pin.join('').length < 4}>
        Confirm PIN
      </Button>
    </form>
  );
}
