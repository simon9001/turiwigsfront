import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, Award, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Tiuri Nails & Wigs Parlour',
  description: 'Learn about Tiuri Nails & Wigs Parlour — Nairobi\'s premier destination for premium human hair wigs, nail art, and professional wig styling.',
};

const VALUES = [
  {
    icon: Sparkles,
    title: 'Premium Quality',
    body: 'Every wig and nail service is held to the highest standard. We source only the finest human hair and use professional-grade products that last.',
  },
  {
    icon: Heart,
    title: 'Client First',
    body: 'Your comfort, confidence, and satisfaction drive everything we do. We take time to understand your style and deliver a look that is uniquely you.',
  },
  {
    icon: Award,
    title: 'Expert Craftsmanship',
    body: 'Our trained stylists bring years of experience in wig fitting, customisation, and nail artistry — combining skill with creativity on every visit.',
  },
  {
    icon: Users,
    title: 'Inclusive Beauty',
    body: 'Beauty has no single shape, size, or shade. We celebrate every client and create a welcoming, judgement-free space for all.',
  },
];

const STATS = [
  { value: '500+', label: 'Happy Clients' },
  { value: '5+', label: 'Years of Experience' },
  { value: '50+', label: 'Wig Styles' },
  { value: '4.9★', label: 'Average Rating' },
];

export default function AboutPage() {
  return (
    <div style={{ background: '#f4f4f2' }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32"
        style={{ background: '#171614' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #8b8881 0%, transparent 60%)' }} />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] mb-5"
            style={{ color: 'rgba(255,255,255,0.72)' }}>
            Our Story
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Beauty is our craft.<br />
            <span style={{ color: '#ffffff' }}>You are our canvas.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.65)' }}>
            Tiuri Nails &amp; Wigs Parlour is Nairobi&apos;s premier destination for premium human hair wigs,
            flawless nail art, and professional wig styling — where every visit is an experience.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/services"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: '#ffffff', color: '#171614' }}>
              Explore Services <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────── */}
      <div style={{ background: '#171614' }}>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-black" style={{ color: '#ffffff' }}>{s.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Who we are ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-4"
              style={{ color: '#8b8881' }}>
              Who We Are
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-snug mb-6"
              style={{ color: '#171614' }}>
              Nairobi&apos;s home for premium wigs &amp; nails
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: '#55534e' }}>
              <p>
                Founded in Nairobi, Kenya, Tiuri Nails &amp; Wigs Parlour was born from a passion for authentic,
                high-quality beauty services that celebrate African women. What started as a small studio has
                grown into one of Nairobi&apos;s most trusted beauty destinations.
              </p>
              <p>
                We specialise in premium human hair wigs — sourced, fitted, styled, and maintained by our
                expert team. Whether you&apos;re looking for a lace-front unit, a full lace wig, or a custom
                installation, we deliver a seamless, natural look tailored to you.
              </p>
              <p>
                Our nail studio offers everything from classic manicures and gel overlays to intricate nail art,
                acrylics, and luxury pedicures. Every treatment is performed with precision, using only
                professional-grade products.
              </p>
            </div>
          </div>

          {/* Image collage */}
          <div className="relative grid grid-cols-2 gap-3 h-[420px]">
            <div className="relative overflow-hidden rounded-2xl row-span-2">
              <Image src="/images/tiuri-wigs.jpeg" alt="Tiuri wigs" fill
                className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
            </div>
            <div className="relative overflow-hidden rounded-2xl">
              <Image src="/images/nails-1.jpeg" alt="Nail art" fill
                className="object-cover" sizes="(max-width: 1024px) 25vw, 15vw" />
            </div>
            <div className="relative overflow-hidden rounded-2xl">
              <Image src="/images/nails-4.jpeg" alt="Nail studio" fill
                className="object-cover" sizes="(max-width: 1024px) 25vw, 15vw" />
            </div>
            {/* Gold badge */}
            <div className="absolute -bottom-4 -left-4 rounded-2xl px-5 py-4 shadow-xl"
              style={{ background: '#171614' }}>
              <p className="text-xs font-black uppercase tracking-widest text-white">Est.</p>
              <p className="text-2xl font-black text-white leading-none">Nairobi</p>
              <p className="text-xs font-bold text-white/70">Kenya</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24" style={{ background: '#fff' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-3"
              style={{ color: '#8b8881' }}>
              What Drives Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: '#171614' }}>
              Our Values
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div key={title}
                className="rounded-2xl border p-6"
                style={{ borderColor: '#dedcd7', background: '#f4f4f2' }}>
                <div className="mb-4 inline-flex rounded-xl p-3"
                  style={{ background: 'rgba(23,22,20,0.12)' }}>
                  <Icon className="h-5 w-5" style={{ color: '#8b8881' }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#171614' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6e6b65' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services teaser ───────────────────────────────────────────── */}
      <section className="py-20 sm:py-24" style={{ background: '#f4f4f2' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { title: 'Premium Wigs', desc: 'Human hair lace-front, full lace, and closure wigs. Custom fitting available.', href: '/products', img: '/images/tiuri-wigs.jpeg' },
              { title: 'Nail Studio', desc: 'Gel, acrylic, nail art, manicures and luxury pedicures by certified technicians.', href: '/services', img: '/images/nails-2.jpeg' },
              { title: 'Wig Services', desc: 'Washing, conditioning, styling, repairs, and colour treatments for your wig.', href: '/services', img: '/images/nails-4.jpeg' },
            ].map((item) => (
              <Link key={item.title} href={item.href}
                className="group relative overflow-hidden rounded-2xl"
                style={{ aspectRatio: '4/3' }}>
                <Image src={item.img} alt={item.title} fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(23,22,20,0.88) 0%, rgba(23,22,20,0.1) 60%, transparent 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-snug mb-4">{item.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#ffffff' }}>
                    Learn More <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#171614' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform your look?
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Book an appointment today or browse our wig collection online.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/bookings"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: '#ffffff', color: '#171614' }}>
              Book Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
              Shop Wigs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
