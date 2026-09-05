'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGallery, type Shot } from '@/hooks/useGallery';

/* ── The wall ──────────────────────────────────────────────────────────────
   A 12 × 4 grid of prints with the copy occupying one block of it, rather
   than floating over a darkened photo. Tiles take turns swapping their
   image, one at a time, so far more of the shop's work gets on screen than
   fits in the grid at once. */

interface Slot { col: number; span: number; row: number; rowSpan?: number }

const SLOTS: Slot[] = [
  // Top band
  { col: 1,  span: 2, row: 1 },
  { col: 3,  span: 3, row: 1 },
  { col: 6,  span: 2, row: 1 },
  { col: 8,  span: 2, row: 1 },
  { col: 10, span: 3, row: 1 },
  // Flanking the copy
  { col: 1,  span: 3, row: 2 },
  { col: 10, span: 3, row: 2 },
  { col: 1,  span: 3, row: 3 },
  { col: 10, span: 3, row: 3 },
  // Bottom band
  { col: 1,  span: 3, row: 4 },
  { col: 4,  span: 2, row: 4 },
  { col: 6,  span: 2, row: 4 },
  { col: 8,  span: 3, row: 4 },
  { col: 11, span: 2, row: 4 },
];

const SWAP_MS = 2400;

function Tile({ shot, eager }: { shot: Shot; eager: boolean }) {
  return (
    <Image
      key={shot.src}
      src={shot.src}
      alt={shot.caption}
      fill
      sizes="(max-width: 1024px) 33vw, 22vw"
      priority={eager}
      loading={eager ? undefined : 'lazy'}
      className="tile-fade object-cover"
    />
  );
}

export function HeroWall() {
  const { shots } = useGallery();
  const [steps, setSteps] = useState<number[]>(() => SLOTS.map(() => 0));
  const tick = useRef(0);

  const canCycle = shots.length > SLOTS.length;

  useEffect(() => {
    if (!canCycle) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = setInterval(() => {
      // One tile changes at a time, round-robin. Calm, and never a
      // whole-grid flicker.
      const slot = tick.current % SLOTS.length;
      tick.current += 1;
      setSteps((prev) => {
        const next = [...prev];
        next[slot] += 1;
        return next;
      });
    }, SWAP_MS);

    return () => clearInterval(id);
  }, [canCycle]);

  const tiles = useMemo(
    () =>
      SLOTS.map((slot, i) => {
        const idx = (i + steps[i] * SLOTS.length) % Math.max(shots.length, 1);
        return { slot, shot: shots[idx] };
      }),
    [shots, steps],
  );

  return (
    <section className="bg-sand px-3 pb-3 pt-3 sm:px-4 sm:pb-4" aria-label="Tiuri Nails and Wigs Parlour">
      {/* ── Desktop: copy sits inside the grid ─────────────────────────── */}
      <div
        className="hidden lg:grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          // `min-content` rather than 0: a row must never be shorter than what
          // sits in it, or the copy card's text spills out past its border on
          // a short viewport. Paired with min-height (not height) the wall
          // still lands on the fold when there is room, and grows when there
          // is not, instead of clipping.
          gridTemplateRows: 'repeat(4, minmax(min-content, 1fr))',
          minHeight: 'min(calc(100svh - 5.5rem), 840px)',
        }}
      >
        {tiles.map(({ slot, shot }, i) =>
          shot ? (
            <div
              key={`${slot.col}-${slot.row}-${slot.span}`}
              className="print relative"
              style={{
                gridColumn: `${slot.col} / span ${slot.span}`,
                gridRow: `${slot.row} / span ${slot.rowSpan ?? 1}`,
              }}
            >
              <Tile shot={shot} eager={i < 6} />
            </div>
          ) : null,
        )}

        <div
          className="card flex flex-col justify-center px-8 py-8 xl:px-12"
          style={{ gridColumn: '4 / span 6', gridRow: '2 / span 2' }}
        >
          <HeroCopy />
        </div>
      </div>

      {/* ── Mobile and tablet: one lead photo, the copy, then the wall ──── */}
      <div className="lg:hidden">
        {tiles[0]?.shot && (
          <div className="print relative mb-2 aspect-[3/2] w-full">
            <Tile shot={tiles[0].shot} eager />
          </div>
        )}

        <div className="card px-6 py-8 sm:px-8 sm:py-10">
          <HeroCopy />
        </div>

        {/* Uniform ratios — mixed ones leave dead rows in a plain grid. */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {tiles.slice(1, 10).map(({ slot, shot }, i) =>
            shot ? (
              <div key={`m-${slot.col}-${slot.row}`} className="print relative aspect-[3/4]">
                <Tile shot={shot} eager={i < 3} />
              </div>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <>
      <h1 className="display text-[2.6rem] leading-[1.02] sm:text-[3.4rem] xl:text-[4rem]">
        Your nails and
        <br />
        your hair, handled.
      </h1>

      <p className="measure mt-5 text-[15px] leading-relaxed text-slate sm:text-base">
        A nail studio and wig shop on TRM Drive, Nairobi. Book a set with a
        technician, or try on wigs and take one home the same day.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href="/bookings" className="btn btn-primary w-full sm:w-auto">
          Book an appointment
        </Link>
        <Link href="/products" className="btn btn-outline w-full sm:w-auto">
          Shop wigs
        </Link>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-mute">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--ok)' }}
            aria-hidden
          />
          Slots open this week
        </span>
        <span>Open Mon to Sat, 9am – 7pm</span>
        <span className="hidden xl:inline">Jewel Complex, TRM Drive</span>
      </div>
    </>
  );
}
