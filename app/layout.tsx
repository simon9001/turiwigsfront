import type { Metadata } from 'next';
import { Geist, Fraunces } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/store/provider';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { Toaster } from 'react-hot-toast';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

// Display face. The SOFT/WONK axes are what keep it warm rather than
// stiff — set per-use in globals.css via font-variation-settings.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Tiuri Nails & Wigs Parlour', template: '%s · Tiuri' },
  description:
    'Nail care and premium human hair wigs in Nairobi. Book a manicure or pedicure, or shop lace fronts and closures — Jewel Complex, TRM Drive.',
  keywords: ['wigs Kenya', 'human hair wigs', 'lace front wigs', 'nail parlour Nairobi', 'Tiuri wigs', 'wig styling Nairobi'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col bg-sand text-slate" suppressHydrationWarning>
        <StoreProvider>
          <LayoutShell>{children}</LayoutShell>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#171614',
                color: '#fff',
                borderRadius: '10px',
                fontSize: '14px',
              },
            }}
          />
        </StoreProvider>
      </body>
    </html>
  );
}
