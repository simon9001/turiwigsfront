'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setTechnician, selectWizard } from '@/store/slices/booking-wizard.slice';
import { TechnicianCard } from '@/components/bookings/TechnicianCard';
import { BookingStepBar } from '@/components/bookings/BookingStepBar';
import { schedulingApi } from '@/api/scheduling.api';

interface StaffProfile {
  id: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
}

export default function TechnicianPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const wizard = useAppSelector(selectWizard);

  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schedulingApi.listStaff()
      .then(({ data }) => {
        const list = (data.data ?? []) as StaffProfile[];
        setStaff(list.filter((s) => s.is_active));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(member: StaffProfile) {
    dispatch(
      setTechnician({
        id: member.id,
        name: member.name,
        title: '',
        photo: member.avatar_url ?? '',
      })
    );
    router.push('/bookings/schedule');
  }

  function handleAnyAvailable() {
    dispatch(setTechnician(null));
    router.push('/bookings/schedule');
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f4f2' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/bookings/services"
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: '#fff', border: '1px solid #dedcd7' }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: '#55534e' }} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#171614' }}>
              Choose Your Technician
            </h1>
            {wizard.service && (
              <p className="text-sm" style={{ color: '#8b8881' }}>
                for {wizard.service.name}
              </p>
            )}
          </div>
        </div>

        {/* Step bar */}
        <div className="mb-5 mt-3">
          <BookingStepBar currentStep={2} />
        </div>

        {/* Any available card */}
        <button
          onClick={handleAnyAvailable}
          className="w-full card-sku p-4 flex items-center gap-4 mb-4 text-left transition-all duration-200 hover:border-[#8b8881]"
          style={
            wizard.technician === null
              ? {
                  borderColor: '#c9c6bf',
                  boxShadow: '0 0 0 2px #8b8881, 0 4px 16px rgba(23,22,20,0.2)',
                }
              : {}
          }
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#e9e8e4', border: '2px dashed #8b8881' }}
          >
            <Users className="h-7 w-7" style={{ color: '#55534e' }} />
          </div>
          <div>
            <p className="font-semibold text-base" style={{ color: '#171614' }}>
              Any Available
            </p>
            <p className="text-sm" style={{ color: '#8b8881' }}>
              We&apos;ll assign the best available technician for your appointment
            </p>
          </div>
        </button>

        {/* Divider */}
        <div className="rule mb-4" />

        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8b8881' }}>
          Or choose a specific technician
        </p>

        {/* Staff grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card-sku p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#8b8881' }}>
            No technicians available at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {staff.map((member) => (
              <TechnicianCard
                key={member.id}
                tech={{
                  id: member.id,
                  name: member.name,
                  photo: member.avatar_url,
                }}
                onSelect={() => handleSelect(member)}
                selected={wizard.technician?.id === member.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
