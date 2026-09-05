'use client';

import Image from 'next/image';
import { useGallery } from '@/hooks/useGallery';

/* A slow horizontal band of the shop's work. It exists to keep photographs
   flowing between the two selling sections without asking for a click.
   Hovering or tabbing into it stops the travel. */

export function PhotoRibbon() {
  const { shots } = useGallery();
  if (shots.length === 0) return null;

  // Doubling the strip is what makes the loop seamless — the animation
  // translates exactly one copy's width.
  const strip = [...shots, ...shots];

  return (
    <section className="ribbon overflow-hidden border-y border-line bg-paper py-4" aria-label="Recent work">
      <div className="ribbon-track gap-2">
        {strip.map((shot, i) => (
          <div
            key={`${shot.src}-${i}`}
            className="print relative h-28 w-24 shrink-0 sm:h-36 sm:w-32"
            aria-hidden={i >= shots.length}
          >
            <Image
              src={shot.src}
              alt={i < shots.length ? shot.caption : ''}
              fill
              sizes="128px"
              loading="lazy"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
