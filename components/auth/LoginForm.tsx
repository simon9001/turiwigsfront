'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { loginThunk, fetchMeThunk } from '@/store/slices/auth.slice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const isUnverified = error === 'EMAIL_NOT_VERIFIED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginThunk(form));
    if (loginThunk.fulfilled.match(result)) {
      await dispatch(fetchMeThunk());
      toast.success('Welcome back!');
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Password"
        type={showPwd ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete="current-password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        suffix={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
            className="flex items-center justify-center transition-colors"
            style={{ color: '#8b8881' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#171614'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#8b8881'; }}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      {/* Unverified email — special prompt */}
      {isUnverified && (
        <div className="rounded-xl border p-4 space-y-2"
          style={{ background: 'rgba(23,22,20,0.08)', borderColor: 'rgba(23,22,20,0.3)' }}>
          <div className="flex items-center gap-2">
            <MailCheck className="h-4 w-4 flex-shrink-0" style={{ color: '#8b8881' }} />
            <p className="text-sm font-semibold" style={{ color: '#171614' }}>
              Email not verified
            </p>
          </div>
          <p className="text-sm" style={{ color: '#6e6b65' }}>
            Please verify your email before signing in.
          </p>
          <Link
            href={`/auth/verify-email${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: '#171614' }}
          >
            Enter verification code →
          </Link>
        </div>
      )}

      {/* Generic error */}
      {error && !isUnverified && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Sign In
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-medium text-neutral-900 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
