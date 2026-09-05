'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGallery, type GalleryKind } from '@/hooks/useGallery';
import { Lightbox } from './Lightbox';

/* Everything the shop has photographed, on one wall. This is the section
   the client cares most about, so it holds the whole library rather than a
   curated handful — filtered, paged, and openable full size. */

const PAGE = 18;

type Filter = 'all' | GalleryKind;

const LABELS: Record<Filter, string> = {
  all: 'Everything',
  nails: 'Nails',
  wigs: 'Wigs',
  studio: 'The shop',
};

/* Varied heights keep the masonry from reading as a spreadsheet. The pattern
   repeats every 7 so it is stable between renders and on the server. */
const RATIOS = ['3 / 4', '1 / 1', '4 / 5', '3 / 4', '2 / 3', '1 / 1', '4 / 5'];

export function GalleryWall() {
  const { shots } = useGallery();
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? shots : shots.filter((s) => s.kind === filter)),
    [shots, filter],
  );

  /* Only offer a filter that would actually return something. An empty
     "Wigs 0" chip advertises a gap instead of the work. */
  const tabs = useMemo(() => {
    const kinds: GalleryKind[] = ['nails', 'wigs', 'studio'];
    const present = kinds
      .map((kind) => ({ key: kind as Filter, count: shots.filter((s) => s.kind === kind).length }))
      .filter((t) => t.count > 0);
    return present.length > 1
      ? [{ key: 'all' as Filter, count: shots.length }, ...present]
      : [];
  }, [shots]);

  if (shots.length === 0) return null;

  function pick(next: Filter) {
    setFilter(next);
    setShown(PAGE);
    setOpen(null);
  }

  const page = visible.slice(0, shown);
  const more = visible.length - page.length;

  return (
    <section id="work" className="scroll-mt-20 bg-sand px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[100rem]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">Work from the shop</h2>
            <p className="measure mt-2 text-sm text-slate">
              Every set and every wig, shot in the room they were made in. Tap any
              photo to see it full size.
            </p>
          </div>

          {tabs.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-1 rounded-full border border-line bg-paper p-1"
              role="group"
              aria-label="Filter photos"
            >
              {tabs.map(({ key, count }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pick(key)}
                    aria-pressed={active}
                    className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                      active ? 'bg-ink text-white' : 'text-slate hover:bg-mist'
                    }`}
                  >
                    {LABELS[key]}
                    <span className={`ml-1.5 tabular-nums ${active ? 'text-white/60' : 'text-mute'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="columns-2 gap-2 sm:columns-3 lg:columns-4 xl:columns-5">
          {page.map((shot, i) => (
            <button
              key={`${shot.src}-${i}`}
              type="button"
              onClick={() => setOpen(i)}
              className="print group relative mb-2 block w-full break-inside-avoid"
              style={{ aspectRatio: shot.ratio ? `${shot.ratio}` : RATIOS[i % RATIOS.length] }}
              aria-label={`Open photo ${i + 1} of ${visible.length}: ${shot.caption}`}
            >
              <Image
                src={shot.src}
                alt={shot.caption}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                loading={i < 6 ? 'eager' : 'lazy'}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          {more > 0 && (
            <div className="flex flex-col items-center gap-3">
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="btn btn-outline">
                Show {Math.min(more, PAGE)} more
              </button>
              <p className="text-[13px] tabular-nums text-mute">
                {page.length} of {visible.length} photos
              </p>
            </div>
          )}

          {/* The biggest section on the page always ends with somewhere to go. */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/bookings" className="btn btn-primary">
              Book an appointment
            </Link>
            <Link href="/products" className="btn btn-outline">
              Shop wigs
            </Link>
          </div>
        </div>
      </div>

      <Lightbox shots={visible} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}
