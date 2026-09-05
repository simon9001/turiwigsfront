'use client';

import Image from 'next/image';
import { Clock, Star } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { setService } from '@/store/slices/booking-wizard.slice';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/formatters';
import type { Service } from '@/types';

interface BookingServiceCardProps {
  service: Service;
  index?: number;
  onSelect?: (s: Service) => void;
}

export function BookingServiceCard({ service, index = 0, onSelect }: BookingServiceCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const imageUrl =
    service.images[0]?.url ??
    `/images/nails-${((index % 6) + 1)}.jpeg`;

  // Simple category derivation from name
  function getCategory(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('wig')) return 'Wigs';
    if (n.includes('pedicure')) return 'Pedicure';
    if (n.includes('gel')) return 'Gel';
    if (n.includes('nail')) return 'Nails';
    return 'Beauty';
  }

  function handleSelect() {
    dispatch(
      setService({
        id: service.id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        slug: service.slug,
        imageUrl,
      })
    );
    onSelect?.(service);
    router.push('/bookings/technician');
  }

  return (
    <button
      onClick={handleSelect}
      className="group relative w-full text-left focus:outline-none overflow-hidden rounded-2xl"
      style={{
        aspectRatio: '3/4',
        boxShadow:
          '0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(23,22,20,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 8px 32px rgba(0,0,0,0.2), 0 0 0 2px #8b8881';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 2px 8px rgba(0,0,0,0.12), 0 0 0 1px rgba(23,22,20,0.1)';
      }}
    >
      {/* Image */}
      <Image
        src={imageUrl}
        alt={service.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 33vw"
      />

      {/* Dark gradient overlay bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(0deg, rgba(23,22,20,0.92) 0%, rgba(23,22,20,0.4) 50%, transparent 100%)',
        }}
      />

      {/* Category tag top-left */}
      <div className="absolute top-3 left-3">
        <span
          className="text-xs font-semibold rounded-full px-2.5 py-1"
          style={{
            background: '#171614',
            color: '#ffffff',
          }}
        >
          {getCategory(service.name)}
        </span>
      </div>

      {/* Popular badge top-right */}
      {service.is_featured && (
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-1"
            style={{
              background: 'rgba(23,22,20,0.85)',
              border: '1px solid rgba(23,22,20,0.5)',
              color: '#ffffff',
            }}
          >
            <Star className="h-3 w-3 fill-current" />
            Popular
          </span>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="text-white font-semibold text-sm leading-snug mb-1.5">
          {service.name}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Clock className="h-3 w-3" />
            <span className="text-xs">{service.duration_minutes} min</span>
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: '#ffffff' }}
          >
            {formatPrice(service.price)}
          </span>
        </div>
      </div>
    </button>
  );
}
