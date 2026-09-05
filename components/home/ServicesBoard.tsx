'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { servicesApi } from '@/api/services.api';
import { formatPrice } from '@/utils/formatters';
import { useGallery } from '@/hooks/useGallery';
import type { Service } from '@/types';

/* Price and duration are the two things a person needs before booking, so
   they sit on the card rather than one page deeper. */

function duration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function Skeleton() {
  return <div className="card h-[22rem] animate-pulse bg-mist" />;
}

export function ServicesBoard() {
  const { nails } = useGallery();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesApi
      .list()
      .then(({ data }) => {
        const all = (data.data ?? []) as Service[];
        const featured = all.filter((s) => s.is_featured);
        const rest = all.filter((s) => !s.is_featured);
        setServices([...featured, ...rest].slice(0, 6));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && services.length === 0) return null;

  return (
    <section className="bg-sand px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">On the menu</h2>
            <p className="measure mt-2 text-sm text-slate">
              Prices are what you pay in the chair. No surprises at the counter.
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm font-semibold text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-ink"
          >
            All services
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
            : services.map((service, i) => {
                const img =
                  service.images?.[0]?.url ?? nails[i % Math.max(nails.length, 1)]?.src;

                return (
                  <Link
                    key={service.id}
                    href={`/services/${service.slug}`}
                    className="card card-hover group flex flex-col overflow-hidden"
                  >
                    {img && (
                      <div className="relative aspect-[5/4] bg-mist">
                        <Image
                          src={img}
                          alt={service.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="display-sm text-lg leading-snug">{service.name}</h3>
                        <p className="shrink-0 text-base font-semibold tabular-nums text-ink">
                          {formatPrice(service.price)}
                        </p>
                      </div>

                      {service.description && (
                        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate">
                          {service.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="btn btn-outline btn-sm">Book this</span>
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-mute">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {duration(service.duration_minutes)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
