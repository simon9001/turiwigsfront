'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useGallery } from '@/hooks/useGallery';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Tiuri+Nails+%26+Wigs+Parlour,+Jewel+Complex,+Room+220,+2nd+Floor+TRM+Dr,+Nairobi';

const HOURS = [
  { days: 'Monday to Friday', time: '9:00am – 7:00pm' },
  { days: 'Saturday', time: '9:00am – 7:00pm' },
  { days: 'Sunday', time: 'Closed' },
];

export function VisitStrip() {
  const { shots } = useGallery();
  const wall = shots.slice(0, 6);

  return (
    <section className="border-t border-line bg-paper px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        {/* Square cells with the lead spanning a 2×2 block. Every cell is
            filled, so the block reads as one shape rather than a ragged grid. */}
        {wall.length > 0 && (
          <div className="grid grid-cols-3 grid-rows-3 gap-2">
            {wall.map((shot, i) => (
              <div
                key={shot.src}
                className="print relative aspect-square"
                style={i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2', aspectRatio: 'auto' } : undefined}
              >
                <Image
                  src={shot.src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 33vw, 18vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <h2 className="display text-[2rem] sm:text-[2.8rem]">Come and see us</h2>
          <p className="measure mt-3 text-[15px] leading-relaxed text-slate">
            Book ahead and the chair is ready when you arrive. Walk in and we will
            fit you in where we can.
          </p>

          <dl className="mt-8 border-t border-line">
            {HOURS.map(({ days, time }) => (
              <div key={days} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                <dt className="text-sm text-slate">{days}</dt>
                <dd className="text-sm font-semibold tabular-nums text-ink">{time}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 flex items-start gap-2.5 text-sm leading-relaxed text-slate">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mute" aria-hidden />
            Jewel Complex, Room 220, 2nd Floor
            <br />
            TRM Drive, Nairobi
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/bookings" className="btn btn-primary">
              Book an appointment
            </Link>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Get directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
