'use client';

import { useEffect, useState } from 'react';
import { homepageImagesApi, type HomepageImage } from '@/api/homepage-images.api';

export type GalleryKind = 'nails' | 'wigs' | 'studio';

export interface Shot {
  src: string;
  kind: GalleryKind;
  caption: string;
  href: string;
  /** width/height ratio, when the backend knows it — drives masonry sizing. */
  ratio?: number;
}

/* Bundled pool, so the shop never renders empty while an admin is still
   uploading. These are labelled by what they actually show: every bundled
   photo is nail work except the one shot of the room. There are no wig
   photos in the repo, so nothing here claims to be one — a pedicure filed
   under "Wigs" costs more trust than an empty shelf does. */
const LOCAL_NAILS = [
  '/images/nails-1.jpeg', '/images/nails-2.jpeg', '/images/nails-3.jpeg',
  '/images/nails-4.jpeg', '/images/nails-5.jpeg', '/images/nails-6.jpeg',
  '/images/nails-7.jpeg', '/images/nails-8.jpeg', '/images/nails-9.jpeg',
  '/images/nails-10.jpeg', '/images/salon-1.jpeg', '/images/salon-2.jpeg',
  '/images/salon-3.jpeg', '/images/salon-4.jpeg', '/images/salon-5.jpeg',
  '/images/salon-6.jpeg', '/images/tiuri-nails.jpeg', '/images/tiuri-wigs.jpeg',
];

const LOCAL_STUDIO = ['/images/salon-7.png'];

const CAPTION: Record<GalleryKind, string> = {
  nails: 'Nail work at Tiuri',
  wigs: 'Wigs at Tiuri',
  studio: 'Inside the shop on TRM Drive',
};

const DESTINATION: Record<GalleryKind, string> = {
  nails: '/services',
  wigs: '/products',
  studio: '/bookings',
};

function shot(src: string, kind: GalleryKind): Shot {
  return { src, kind, caption: CAPTION[kind], href: DESTINATION[kind] };
}

const FALLBACK: Shot[] = [
  ...LOCAL_NAILS.map((s) => shot(s, 'nails')),
  ...LOCAL_STUDIO.map((s) => shot(s, 'studio')),
];

function kindOf(img: HomepageImage): GalleryKind {
  if (img.section === 'philosophy_wigs') return 'wigs';
  if (img.section === 'philosophy_nails') return 'nails';

  const hint = `${img.label ?? ''} ${img.href ?? ''} ${img.caption ?? ''}`.toLowerCase();
  if (/wig|lace|closure|frontal|bundle|weave|ponytail|\/products/.test(hint)) return 'wigs';
  if (/salon|studio|shop|interior|space|room/.test(hint)) return 'studio';
  return 'nails';
}

function toShot(img: HomepageImage): Shot {
  const kind = kindOf(img);
  return {
    src: img.url,
    kind,
    caption: img.caption ?? img.label ?? CAPTION[kind],
    href: img.href ?? DESTINATION[kind],
    ratio: img.width && img.height ? img.width / img.height : undefined,
  };
}

/**
 * Deal the buckets out in a fixed rotation so no kind clumps in a grid.
 * Nails appear twice per turn because that is the real mix of the work.
 */
function weave(shots: Shot[]): Shot[] {
  const buckets: Record<GalleryKind, Shot[]> = {
    nails: shots.filter((s) => s.kind === 'nails'),
    wigs: shots.filter((s) => s.kind === 'wigs'),
    studio: shots.filter((s) => s.kind === 'studio'),
  };
  const rotation: GalleryKind[] = ['nails', 'wigs', 'nails', 'wigs', 'studio'];

  const out: Shot[] = [];
  while (out.length < shots.length) {
    const before = out.length;
    for (const kind of rotation) {
      const next = buckets[kind].shift();
      if (next) out.push(next);
    }
    // A full rotation that moved nothing means every bucket is drained.
    if (out.length === before) break;
  }
  return out;
}

function dedupe(shots: Shot[]): Shot[] {
  const seen = new Set<string>();
  return shots.filter((s) => (seen.has(s.src) ? false : (seen.add(s.src), true)));
}

/**
 * Seven components on the homepage call useGallery, and they all want the same
 * list. Caching the in-flight promise at module scope means one request per
 * page load instead of one per consumer. The short TTL keeps that from going
 * stale for the whole session — an admin who uploads an image and comes back
 * to the homepage should see it.
 */
let pending: Promise<Shot[]> | null = null;
let fetchedAt = 0;

/** How long a resolved result is reused before the next mount refetches. */
const TTL_MS = 60_000;

function fetchShots(): Promise<Shot[]> {
  if (pending && Date.now() - fetchedAt < TTL_MS) return pending;

  fetchedAt = Date.now();
  pending = homepageImagesApi
    .list()
    .then(({ data }) => {
      const grouped = data.data ?? {};
      return dedupe(Object.values(grouped).flat().filter(Boolean).map(toShot));
    })
    .catch(() => {
      // Let the next mount try again rather than caching the failure.
      pending = null;
      fetchedAt = 0;
      return [] as Shot[];
    });
  return pending;
}

/**
 * Every homepage image the shop has, pooled into one list.
 * Renders full on first paint from the bundled set, then swaps in whatever
 * the admin has uploaded.
 */
export function useGallery() {
  const [shots, setShots] = useState<Shot[]>(() => weave(FALLBACK));
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchShots().then((uploaded) => {
      if (cancelled || uploaded.length === 0) return;  // bundled images stay
      setShots(weave(uploaded));
      setLive(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    shots,
    nails: shots.filter((s) => s.kind === 'nails'),
    wigs: shots.filter((s) => s.kind === 'wigs'),
    studio: shots.filter((s) => s.kind === 'studio'),
    /** true once the admin's own uploads are on screen */
    live,
  };
}
