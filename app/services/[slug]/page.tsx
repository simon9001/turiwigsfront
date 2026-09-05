'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Clock, Users, ArrowLeft, CalendarDays, Volume2, VolumeX, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { servicesApi } from '@/api/services.api';
import { formatPrice } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { bookingsApi } from '@/api/bookings.api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BookingPaymentModal } from '@/components/booking/BookingPaymentModal';
import type { Service, ServiceSlot } from '@/types';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatSlotTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [slots, setSlots] = useState<ServiceSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    bookingId: string;
    bookingNumber: string;
    depositAmount: number;
    balanceAmount: number;
  } | null>(null);

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Load service once
  useEffect(() => {
    servicesApi.getBySlug(slug)
      .then(({ data }) => setService(data.data))
      .catch(() => toast.error('Could not load this service'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reload slots whenever service or date changes
  useEffect(() => {
    if (!service) return;
    servicesApi.getSlots(service.id, selectedDate)
      .then(({ data }) => setSlots(data.data))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [service, selectedDate]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!selectedSlot || !service) return;
    const slot = slots.find((s) => (s.id ?? s.start_time) === selectedSlot);
    if (!slot) { toast.error('Please select a time slot'); return; }

    setBooking(true);
    try {
      const { data } = await bookingsApi.create({
        serviceId: service.id,
        ...(slot.id ? { slotId: slot.id } : {}),
        scheduledDate: slot.slot_date ?? selectedDate,
        scheduledTime: slot.start_time,
      });
      const b = data.data;
      setPaymentModal({
        bookingId: b.id,
        bookingNumber: b.booking_number,
        depositAmount: b.deposit_amount,
        balanceAmount: b.balance_amount,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not create booking';
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!service) return <div className="p-10 text-center text-neutral-500">Service not found</div>;

  const mainImageUrl = service.images?.[0]?.url ?? '/images/nails-1.jpeg';

  return (
    <div style={{ background: '#f4f4f2', minHeight: '100vh' }}>
      {paymentModal && (
        <BookingPaymentModal
          bookingId={paymentModal.bookingId}
          bookingNumber={paymentModal.bookingNumber}
          serviceName={service.name}
          scheduledDate={selectedDate}
          scheduledTime={slots.find((s) => (s.id ?? s.start_time) === selectedSlot)?.start_time ?? ''}
          totalPrice={service.price}
          depositAmount={paymentModal.depositAmount}
          balanceAmount={paymentModal.balanceAmount}
          onClose={() => setPaymentModal(null)}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <Link href="/services" className="mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: '#171614' }}>
          <ArrowLeft className="h-4 w-4" style={{ color: '#8b8881' }} /> Back to All Services
        </Link>

        {/* Instagram-inspired Main Split Card */}
        <div 
          className="rounded-3xl border overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12"
          style={{ borderColor: '#dedcd7', background: '#ffffff' }}
        >
          {/* LEFT / TOP: Media Container (Video or Image) */}
          <div className="lg:col-span-6 xl:col-span-7 bg-black relative flex items-center justify-center min-h-[420px] lg:min-h-[600px] overflow-hidden">
            {service.video_url ? (
              <div className="relative w-full h-full min-h-[420px] lg:min-h-[600px] flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  src={service.video_url}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={togglePlay}
                  className="w-full h-full max-h-[700px] object-cover cursor-pointer"
                />

                {/* Media overlay controls */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                {/* Top brand badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold border border-white/20">
                  <div className="w-6 h-6 rounded-full bg-white text-ink font-extrabold flex items-center justify-center text-[10px]">
                    T
                  </div>
                  <span>tiurinailspalour</span>
                </div>

                {/* Play/Pause indicator on click */}
                <button 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-transparent group focus:outline-none"
                >
                  {!isPlaying && (
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                      <Play className="h-8 w-8 fill-white translate-x-0.5" />
                    </div>
                  )}
                </button>

                {/* Video Mute Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/90 transition-colors border border-white/20"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[420px] lg:min-h-[600px] bg-neutral-900">
                <Image
                  src={mainImageUrl}
                  alt={service.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold border border-white/20">
                  <div className="w-6 h-6 rounded-full bg-white text-ink font-extrabold flex items-center justify-center text-[10px]">
                    T
                  </div>
                  <span>tiurinailspalour</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT / BOTTOM: Details & Booking Panel */}
          <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-8 flex flex-col justify-between" style={{ background: '#ffffff' }}>
            <div>
              {/* Category & Badge */}
              <div className="flex items-center gap-2 mb-3">
                {service.category && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-slate bg-mist border border-line">
                    {service.category.replace('-', ' ')}
                  </span>
                )}
                {service.is_featured && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-ink bg-mist border border-line-2">
                    Popular
                  </span>
                )}
              </div>

              {/* Service Title & Price */}
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2" style={{ color: '#171614' }}>
                {service.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-2xl font-black" style={{ color: '#171614' }}>
                  {formatPrice(service.price)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8b8881' }}>
                  <Clock className="h-3.5 w-3.5" />
                  {service.duration_minutes} minutes
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8b8881' }}>
                  <Users className="h-3.5 w-3.5" />
                  Max {service.capacity}
                </span>
              </div>

              {/* Description */}
              {service.description && (
                <div className="mb-6 p-4 rounded-xl text-sm leading-relaxed" style={{ background: '#f4f4f2', color: '#55534e', borderLeft: '3px solid #8b8881' }}>
                  {service.description}
                </div>
              )}

              {/* Date & Slot Picker */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#171614' }}>
                    <CalendarDays className="h-4 w-4" style={{ color: '#8b8881' }} />
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayIso()}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      // Clear the old pick with the change that invalidates it.
                      setSlotsLoading(true);
                      setSelectedSlot(null);
                      setSelectedDate(e.target.value);
                    }}
                    className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-neutral-800 outline-none focus:ring-2"
                    style={{ borderColor: '#dedcd7', background: '#f4f4f2' }}
                  />
                </div>

                <div className="border-t pt-4" style={{ borderColor: '#e9e8e4' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#171614' }}>
                    Available Slots
                  </h3>

                  {slotsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c9c6bf', borderTopColor: 'transparent' }} />
                    </div>
                  ) : !slots.length ? (
                    <p className="text-xs text-neutral-500 py-2">No slots available on this day. Please select another date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const key = slot.id ?? slot.start_time;
                        const isSelected = selectedSlot === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedSlot(isSelected ? null : key)}
                            className="rounded-xl p-2.5 text-center text-xs transition-all font-medium border"
                            style={{
                              background: isSelected ? '#171614' : '#f4f4f2',
                              borderColor: isSelected ? '#171614' : '#dedcd7',
                              color: isSelected ? '#ffffff' : '#3f3d39',
                              boxShadow: isSelected ? '0 2px 8px rgba(23,22,20,0.2)' : 'none',
                            }}
                          >
                            <p className="font-bold">{formatSlotTime(slot.start_time)}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Booking Button */}
            <div className="pt-4 border-t" style={{ borderColor: '#e9e8e4' }}>
              <Button 
                fullWidth 
                size="lg" 
                onClick={handleBook} 
                loading={booking} 
                disabled={!selectedSlot || slotsLoading}
                className="btn-ink shadow-lg py-3.5 text-base"
              >
                {isAuthenticated ? `Book Appointment · ${formatPrice(service.price)}` : 'Sign in to Book'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
