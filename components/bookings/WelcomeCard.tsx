'use client';

import Link from 'next/link';
import { Star, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function WelcomeCard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: '#171614',
      }}
    >
      {/* Decorative shimmer */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {getGreeting()}
        </p>
        <h2 className="text-2xl font-bold text-white mb-0.5">
          {firstName} 👋
        </h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Ready for your next appointment?
        </p>

        {/* Membership + points row */}
        <div className="flex items-center gap-3 mb-5">
          {/* Gold member badge */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{
              background: '#171614',
              boxShadow: '0 2px 8px rgba(23,22,20,0.4)',
            }}
          >
            <Star className="h-3.5 w-3.5" style={{ color: '#ffffff', fill: '#ffffff' }} />
            <span className="text-xs font-bold" style={{ color: '#ffffff' }}>
              Gold Member
            </span>
          </div>

          {/* Reward points */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(23,22,20,0.35)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: '#ffffff' }} />
            <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>
              120 pts
            </span>
          </div>
        </div>

        {/* Book now button */}
        <Link
          href="/bookings/services"
          className="btn-ink inline-flex items-center justify-center rounded-xl px-5 font-semibold text-sm"
          style={{ height: '40px' }}
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
