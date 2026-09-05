'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Tiuri+Nails+%26+Wigs+Parlour,+Jewel+Complex,+Room+220,+2nd+Floor+TRM+Dr,+Nairobi';
const ADDRESS = 'Jewel Complex, Room 220, 2nd Floor, TRM Drive, Nairobi';

const links = {
  Shop: [
    { label: 'All wigs', href: '/products' },
    { label: 'Human hair', href: '/products?categorySlug=human-hair' },
    { label: 'Lace front', href: '/products?categorySlug=lace-front' },
    { label: 'Your cart', href: '/cart' },
  ],
  Salon: [
    { label: 'All services', href: '/services' },
    { label: 'Book an appointment', href: '/bookings' },
    { label: 'Your bookings', href: '/account/bookings' },
    { label: 'Your orders', href: '/account/orders' },
  ],
  Shop_info: [
    { label: 'About us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'Terms and conditions', href: '/terms' },
  ],
};

const SECTION_LABELS: Record<string, string> = {
  Shop: 'Shop',
  Salon: 'Salon',
  Shop_info: 'Tiuri',
};

/* Platform marks that lucide-react does not ship. */
function TikTokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@tiurinails', Icon: TikTokIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/tiurinails', Icon: InstagramIcon },
  { label: 'Facebook', href: 'https://www.facebook.com/tiurinails', Icon: FacebookIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 overflow-hidden rounded-md border border-line">
                <Image src="/logo.jpeg" alt="" fill className="object-cover" />
              </div>
              <div>
                <p className="display-sm text-lg leading-tight">Tiuri</p>
                <p className="text-[11px] text-mute">Nails &amp; Wigs Parlour</p>
              </div>
            </div>

            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate">
              Nail care and human hair wigs in Nairobi. Book a chair or shop the
              shelf.
            </p>

            <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-mute">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {ADDRESS}
            </p>

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm mt-4"
            >
              Get directions
            </a>

            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate transition-colors hover:border-line-2 hover:text-ink"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-ink">{SECTION_LABELS[section]}</h3>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate transition-colors hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-mute">
            {`© ${new Date().getFullYear()} Tiuri Nails & Wigs Parlour, Nairobi.`}
          </p>
          <p className="text-[13px] text-mute">Payments secured by Paystack</p>
        </div>
      </div>
    </footer>
  );
}
