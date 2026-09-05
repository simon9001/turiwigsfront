'use client';

import Link from 'next/link';
import { StoriesBar } from '@/components/bookings/StoriesBar';
import { WelcomeCard } from '@/components/bookings/WelcomeCard';
import { UpcomingCard } from '@/components/bookings/UpcomingCard';
import { CalendarPlus } from 'lucide-react';

export default function BookingsDashboardPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#f4f4f2' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Stories row */}
        <StoriesBar />

        {/* Welcome card */}
        <WelcomeCard />

        {/* Upcoming booking */}
        <UpcomingCard />

        {/* Book new appointment CTA */}
        <Link
          href="/bookings/services"
          className="btn-ink flex items-center justify-center gap-2 w-full rounded-xl h-13 text-base font-semibold"
          style={{ height: '52px' }}
        >
          <CalendarPlus className="h-5 w-5" />
          Book New Appointment
        </Link>
      </div>
    </div>
  );
}
