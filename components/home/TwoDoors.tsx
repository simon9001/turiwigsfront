'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useGallery, type Shot } from '@/hooks/useGallery';

/* The fork. Everything on the homepage funnels to one of two actions:
   book a chair, or buy a wig. This is where a visitor picks. */

interface DoorProps {
  title: string;
  blurb: string;
  cta: string;
  href: string;
  meta: string;
  shots: Shot[];
  eager: boolean;
}

function Door({ title, blurb, cta, href, meta, shots, eager }: DoorProps) {
  const [lead, ...rest] = shots;
  const thumbs = rest.slice(0, 4);

  return (
    <Link
      href={href}
      className="card card-hover group flex min-h-[30rem] flex-col overflow-hidden sm:min-h-[34rem]"
    >
      {/* The image is the flexible part of the card. A door with no thumbnail
          strip grows its photo instead of leaving a hole beside the one that
          has a strip. */}
      {lead ? (
        <div className="print relative min-h-[15rem] flex-1 rounded-none">
          <Image
            src={lead.src}
            alt={lead.caption}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={eager}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        /* No photo for this side yet. Say so plainly rather than borrowing
           one from the other side, which would misrepresent the work. */
        <div className="flex min-h-[15rem] flex-1 items-center justify-center bg-mist px-6 text-center">
          <p className="text-sm text-mute">Photos of the shelf are on the way</p>
        </div>
      )}

      {/* A strip of supporting work, so each door shows range, not one shot.
          Only rendered when there is a full strip to show. */}
      {thumbs.length === 4 && (
        <div className="grid grid-cols-4 gap-px bg-line">
          {thumbs.map((s) => (
            <div key={s.src} className="relative aspect-square bg-mist">
              <Image src={s.src} alt="" fill sizes="14vw" loading="lazy" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="p-6 sm:p-7">
        <h3 className="display-sm text-2xl sm:text-[1.75rem]">{title}</h3>
        <p className="measure mt-2.5 text-sm leading-relaxed text-slate">{blurb}</p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="btn btn-primary btn-sm">{cta}</span>
          <span className="text-[13px] text-mute">{meta}</span>
        </div>
      </div>
    </Link>
  );
}

export function TwoDoors() {
  const { nails, wigs, studio } = useGallery();

  // A shot of the room is an honest stand-in for the wig shelf; nail work
  // is not, so it is never borrowed across.
  const wigShots = wigs.length > 0 ? wigs : studio;

  return (
    <section className="bg-sand px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 md:grid-cols-2">
          <Door
            title="Nails"
            blurb="Gel, acrylic, overlays and pedicures, done in a quiet room with clean tools. Pick a technician and a time that suits you."
            cta="Book a set"
            href="/bookings"
            meta="From 45 minutes"
            shots={nails}
            eager
          />
          <Door
            title="Wigs"
            blurb="Human hair lace fronts, closures and bundles. Try them on in the shop, or order online and collect from TRM Drive."
            cta="Shop wigs"
            href="/products"
            meta="Same-day collection"
            shots={wigShots}
            eager={false}
          />
        </div>
      </div>
    </section>
  );
}
