'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/api/auth.api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Must match backend passwordSchema in auth.controller.ts
function validatePassword(pw: string) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
  };
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {ok
        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
        : <XCircle      className="h-3.5 w-3.5 text-neutral-300 shrink-0" />}
      <span className={ok ? 'text-green-600' : 'text-neutral-400'}>{label}</span>
    </div>
  );
}

function ResetPasswordForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const email   = params.get('email') ?? '';
  const token   = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  // Derived straight from the URL — it never needs to be state.
  const invalid = !email || !token;

  const rules   = validatePassword(password);
  const allGood = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allGood) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, token, password);
      toast.success('Password updated! You can now sign in.');
      router.push('/auth/login');
    } catch (err: unknown) {
      type ErrShape = {
        response?: {
          data?: {
            error?: string;
            issues?: { path: string; message: string }[];
          };
        };
      };
      const res = (err as ErrShape)?.response?.data;

      // If Zod returned field-level issues, show the first one directly
      const zodMsg = res?.issues?.[0]?.message ?? '';
      const serverMsg = zodMsg || res?.error || '';

      if (/expired/i.test(serverMsg)) {
        toast.error('This reset link has expired. Please request a new one.');
      } else if (/invalid/i.test(serverMsg)) {
        toast.error('Invalid reset link. Please request a new one.');
      } else if (serverMsg && serverMsg !== 'Validation failed') {
        toast.error(serverMsg);
      } else {
        toast.error('Reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-500">This reset link is invalid or incomplete.</p>
        <Button variant="secondary" onClick={() => router.push('/auth/forgot-password')}>
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Input
          label="New Password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password && (
          <div className="mt-2 space-y-1 pl-1">
            <PasswordRule ok={rules.length}    label="At least 8 characters" />
            <PasswordRule ok={rules.uppercase} label="One uppercase letter (A–Z)" />
            <PasswordRule ok={rules.lowercase} label="One lowercase letter (a–z)" />
            <PasswordRule ok={rules.number}    label="One number (0–9)" />
          </div>
        )}
      </div>

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
      />

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        disabled={!allGood || password !== confirm}
      >
        Update Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
          <p className="mt-2 text-sm text-neutral-500">Choose a new password for your account.</p>
        </div>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
