'use client';

import { Smartphone, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MpesaFormProps {
  amount: string;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
}

export function MpesaForm({ amount, loading, error, onSubmit }: MpesaFormProps) {
  return (
    <div className="space-y-5">
      {/* M-Pesa branding */}
      <div className="flex items-center justify-center gap-3 rounded-2xl bg-green-50 py-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-green-800">M-Pesa</p>
          <p className="text-xs text-green-600">via Paystack · Safaricom</p>
        </div>
      </div>

      {/* Amount */}
      <div className="rounded-xl bg-neutral-50 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-neutral-500">Amount to pay</span>
        <span className="text-base font-bold text-neutral-900">{amount}</span>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 space-y-1.5 text-sm text-green-800">
        <p className="font-medium">How it works:</p>
        <p>1. Click the button below — you&rsquo;ll be taken to Paystack&rsquo;s secure page</p>
        <p>2. Enter your M-Pesa number and confirm the STK push on your phone</p>
        <p>3. You&rsquo;ll be redirected back here once payment is confirmed</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Button
        fullWidth
        size="lg"
        loading={loading}
        onClick={onSubmit}
        className="bg-green-600 hover:bg-green-700 gap-2"
      >
        {!loading && <ExternalLink className="h-4 w-4" />}
        Pay {amount} with M-Pesa
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
        <Lock className="h-3 w-3" />
        <span>Secured by Paystack · 256-bit SSL</span>
      </div>
    </div>
  );
}
