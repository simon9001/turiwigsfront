import Image from 'next/image';
import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="flex flex-1">

      {/* ── Left: form panel ──────────────────────────────────────── */}
      <div
        className="relative flex w-full flex-col justify-center overflow-y-auto px-6 py-16 lg:w-[480px] lg:flex-shrink-0 xl:w-[520px]"
        style={{ background: '#f4f4f2' }}
      >
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mb-5 flex justify-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl"
                style={{ boxShadow: '0 4px 16px rgba(23,22,20,0.2), 0 1px 0 rgba(255,255,255,0.15) inset' }}>
                <Image src="/logo.jpeg" alt="Tiuri Logo" fill sizes="64px" className="object-cover" priority />
              </div>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#171614' }}>Sign In</h1>
            <p className="mt-2 text-sm" style={{ color: '#6e6b65' }}>Welcome back to Tiuri</p>
          </div>
          <LoginForm />
        </div>
      </div>

      {/* ── Right: image panel (desktop only) ─────────────────────── */}
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
            src="/images/auth-login.jpeg"
            alt="Tiuri Nails & Wigs salon"
            fill className="object-cover" priority sizes="50vw"
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(23,22,20,0.5) 0%, rgba(23,22,20,0.1) 55%, rgba(0,0,0,0.45) 100%)' }}
          />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Est. Nairobi, Kenya
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug">Your beauty,<br />our craft.</h2>
            <p className="mt-2 text-sm text-white/70">Premium wigs, nails &amp; salon services.</p>
            <div className="mt-4 h-0.5 w-16 rounded-full" style={{ background: '#171614' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
