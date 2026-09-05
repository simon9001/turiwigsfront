'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useCartSync } from '@/hooks/useCart';

// Dashboard routes get their own full-screen shell with no public Header/Footer.
const DASHBOARD_PREFIXES = ['/admin', '/staff'];

// Auth routes still get the Header but no Footer — and the main becomes a flex column
// so the split layout stretches to fill the remaining viewport height.
const AUTH_PREFIXES = ['/auth', '/login', '/register', '/forgot-password', '/reset-password'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  // Single owner of the cart fetch for the whole public app. Admin and staff
  // screens have no cart, so they skip it.
  useCartSync(!isDashboard);

  if (isDashboard) return <>{children}</>;

  if (isAuth) {
    return (
      <>
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
