'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Shot } from '@/hooks/useGallery';

interface Props {
  shots: Shot[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}

export function Lightbox({ shots, index, onClose, onIndex }: Props) {
  const open = index !== null && shots.length > 0;

  const prev = useCallback(() => {
    if (index === null) return;
    onIndex((index - 1 + shots.length) % shots.length);
  }, [index, shots.length, onIndex]);

  const next = useCallback(() => {
    if (index === null) return;
    onIndex((index + 1) % shots.length);
  }, [index, shots.length, onIndex]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, prev, next]);

  if (!open) return null;
  const shot = shots[index];
  if (!shot) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[#0f0e0d]"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-xs text-white/55 tabular-nums">
          {index + 1} of {shots.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-3 pb-3 sm:px-16">
        {shots.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous photo"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          className="relative h-full w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={shot.src}
            alt={shot.caption}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {shots.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next photo"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        className="flex flex-col items-center gap-3 px-4 pb-6 pt-2 text-center sm:pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white/70">{shot.caption}</p>
        <Link
          href={shot.kind === 'wigs' ? '/products' : '/bookings'}
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#171614] transition-opacity hover:opacity-90"
        >
          {shot.kind === 'wigs' ? 'Shop wigs like this' : 'Book this look'}
        </Link>
      </div>
    </div>
  );
}
