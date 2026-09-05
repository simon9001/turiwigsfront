'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';

interface Technician {
  id: string;
  name: string;
  title?: string;
  experience?: string;
  languages?: string[];
  skills?: string[];
  rating?: number;
  reviews?: number;
  photo?: string;
  bio?: string;
  slots?: string[];
  certifications?: string[];
}

interface TechnicianCardProps {
  tech: Technician;
  onSelect: () => void;
  selected?: boolean;
}

export function TechnicianCard({ tech, onSelect, selected }: TechnicianCardProps) {
  return (
    <div
      className="card-sku p-4 cursor-pointer transition-all duration-200"
      style={
        selected
          ? {
              borderColor: '#c9c6bf',
              boxShadow:
                '0 0 0 2px #8b8881, 0 4px 16px rgba(23,22,20,0.2)',
            }
          : {}
      }
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div className="flex gap-4">
        {/* Photo */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
            {tech.photo ? (
              <Image
                src={tech.photo}
                alt={tech.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold" style={{ color: '#171614' }}>
                {tech.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {selected && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: '#171614', color: '#ffffff' }}
            >
              ✓
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h4 className="font-semibold text-base" style={{ color: '#171614' }}>
              {tech.name}
            </h4>
            {tech.rating != null && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs font-semibold" style={{ color: '#8b8881' }}>
                  {tech.rating}
                </span>
                <StarRating value={Math.round(tech.rating)} size="sm" />
              </div>
            )}
          </div>

          {tech.title && (
            <p className="text-sm mb-0.5" style={{ color: '#55534e' }}>
              {tech.title}
            </p>
          )}

          {(tech.experience || tech.reviews != null) && (
            <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#8b8881' }}>
              {tech.experience && (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{tech.experience} experience</span>
                </>
              )}
              {tech.experience && tech.reviews != null && <span>·</span>}
              {tech.reviews != null && <span>{tech.reviews} reviews</span>}
            </div>
          )}

          {tech.skills && tech.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tech.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs rounded-full px-2 py-0.5 font-medium"
                  style={{
                    background: 'rgba(23,22,20,0.08)',
                    color: '#55534e',
                    border: '1px solid rgba(23,22,20,0.12)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {tech.slots && tech.slots.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tech.slots.map((slot) => (
                <span
                  key={slot}
                  className="text-xs rounded-lg px-2 py-0.5 font-medium"
                  style={{
                    background: '#f4f4f2',
                    color: '#55534e',
                    border: '1px solid #dedcd7',
                  }}
                >
                  {slot}
                </span>
              ))}
            </div>
          )}

          {/* Select button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="btn-ink rounded-xl px-4 text-sm font-semibold"
            style={{ height: '34px' }}
          >
            {selected ? 'Selected ✓' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
}
