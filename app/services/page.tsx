'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight, Play } from 'lucide-react';
import { servicesApi } from '@/api/services.api';
import { formatPrice } from '@/utils/formatters';
import type { Service } from '@/types';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All Services' },
  { id: 'manicure', label: 'Manicure' },
  { id: 'nails-extension', label: 'Nails Extension' },
  { id: 'refills', label: 'Refills' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'soak-off', label: 'Soak Off' },
];

const FALLBACK_IMAGES = [
  '/images/nails-1.jpeg',
  '/images/nails-4.jpeg',
  '/images/nails-2.jpeg',
  '/images/tiuri-wigs.jpeg',
];

function getImage(service: Service, index: number) {
  return service.images?.[0]?.url ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border overflow-hidden" style={{ borderColor: '#dedcd7', background: '#fff' }}>
      <div className="w-full aspect-[4/3]" style={{ background: '#dedcd7' }} />
      <div className="p-5">
        <div className="h-5 w-2/3 rounded-lg mb-3" style={{ background: '#dedcd7' }} />
        <div className="h-3 w-full rounded mb-2" style={{ background: '#e9e8e4' }} />
        <div className="h-3 w-4/5 rounded mb-5" style={{ background: '#e9e8e4' }} />
        <div className="flex justify-between pt-4 border-t" style={{ borderColor: '#e9e8e4' }}>
          <div className="h-5 w-20 rounded" style={{ background: '#dedcd7' }} />
          <div className="h-4 w-16 rounded" style={{ background: '#e9e8e4' }} />
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cat = activeCategory === 'all' ? undefined : activeCategory;
    servicesApi
      .list(cat)
      .then(({ data }) => setServices(data.data))
      .catch(() => toast.error('Could not load services'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div style={{ background: '#f4f4f2', minHeight: '100vh' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-3" style={{ color: '#8b8881' }}>
            What We Offer
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: '#171614' }}>
            Our Services
          </h1>
          <p className="mt-3 text-sm max-w-lg leading-relaxed" style={{ color: '#6e6b65' }}>
            Explore our professional salon services, watch video demos, and book your appointment.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-10 flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === activeCategory) return;
                  setLoading(true); setActiveCategory(cat.id);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200"
                style={{
                  background: isActive ? '#171614' : '#ffffff',
                  color: isActive ? '#ffffff' : '#3f3d39',
                  border: `1px solid ${isActive ? '#171614' : '#dedcd7'}`,
                  boxShadow: isActive
                    ? '0 4px 12px rgba(23,22,20,0.25)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : services.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <p className="text-base font-semibold" style={{ color: '#171614' }}>No services found</p>
                  <p className="text-sm mt-1" style={{ color: '#6e6b65' }}>Try selecting a different category above.</p>
                </div>
              )
            : services.map((service, i) => (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col rounded-2xl border overflow-hidden transition-all hover:shadow-lg relative"
                  style={{ borderColor: '#dedcd7', background: '#fff' }}
                >
                  {/* Image / Thumbnail Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-900">
                    <Image
                      src={getImage(service, i)}
                      alt={service.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    />

                    {/* Video badge indicator */}
                    {service.video_url && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-white shadow-sm">
                        <Play className="h-3 w-3 fill-white" />
                        <span>Video</span>
                      </div>
                    )}

                    {/* Category tag */}
                    {service.category && (
                      <div className="absolute bottom-3 left-3 bg-ink/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold text-amber-300 border border-amber-400/30">
                        {service.category.replace('-', ' ')}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold leading-snug" style={{ color: '#171614' }}>
                        {service.name}
                      </h2>
                      <ArrowRight
                        className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1 mt-0.5"
                        style={{ color: '#8b8881' }}
                      />
                    </div>

                    {service.description && (
                      <p className="mt-2 text-sm leading-relaxed flex-1 line-clamp-2" style={{ color: '#6e6b65' }}>
                        {service.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: '#e9e8e4' }}>
                      <span className="text-base font-bold" style={{ color: '#171614' }}>
                        {formatPrice(service.price)}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: '#8b8881' }}>
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </div>
  );
}
