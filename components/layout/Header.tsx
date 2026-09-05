'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { toggleMobileMenu } from '@/store/slices/ui.slice';
import { cn } from '@/utils/cn';

const NAV = [
  { label: 'Wigs', href: '/products' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function IconButton({
  onClick,
  href,
  label,
  count,
  children,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  const cls =
    'relative flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-mist hover:text-ink';

  const badge =
    count != null && count > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold tabular-nums text-white">
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label}>
        {children}
        {badge}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {children}
      {badge}
    </button>
  );
}

export function Header() {
  const { count, toggle: toggleCart } = useCart();
  const { user } = useAuth();
  const { isAdmin, isStaff } = useRole();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const mobileOpen = useAppSelector((s) => s.ui.mobileMenuOpen);

  const dashboardHref = isAdmin ? '/admin' : isStaff ? '/staff' : null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-md border border-line">
              <Image src="/logo.jpeg" alt="" fill className="object-cover" priority />
            </div>
            <span className="display-sm text-lg leading-none">
              Tiuri
              <span className="ml-2 hidden font-sans text-[11px] font-medium tracking-wide text-mute sm:inline">
                Nails &amp; Wigs
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm transition-colors',
                    active ? 'font-semibold text-ink' : 'text-slate hover:bg-mist hover:text-ink',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {dashboardHref && (
              <Link
                href={dashboardHref}
                className="ml-1 rounded-full border border-line-2 px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-mist"
              >
                {isAdmin ? 'Admin' : 'Staff'}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 sm:flex">
              <IconButton href="/products" label="Search wigs">
                <Search className="h-[18px] w-[18px]" />
              </IconButton>
              <IconButton href="/account/wishlist" label="Saved items">
                <Heart className="h-[18px] w-[18px]" />
              </IconButton>
              <IconButton
                href={user ? '/account/profile' : '/auth/login'}
                label={user ? 'Your account' : 'Sign in'}
              >
                <User className="h-[18px] w-[18px]" />
              </IconButton>
            </div>

            {/* Always reachable. People add wigs to the cart from the
                homepage, not only from the shop. */}
            <IconButton onClick={toggleCart} label="Cart" count={count}>
              <ShoppingBag className="h-[18px] w-[18px]" />
            </IconButton>

            <Link href="/bookings" className="btn btn-primary btn-sm ml-1">
              Book
            </Link>

            <button
              type="button"
              onClick={() => dispatch(toggleMobileMenu())}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-mist md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn('fixed inset-0 z-50 md:hidden', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/40 transition-opacity duration-200',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => dispatch(toggleMobileMenu())}
        />

        <nav
          className={cn(
            'absolute inset-x-0 top-0 bg-paper transition-transform duration-200',
            mobileOpen ? 'translate-y-0' : '-translate-y-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="display-sm text-lg">Menu</span>
            <button
              type="button"
              onClick={() => dispatch(toggleMobileMenu())}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-mist"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col p-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => dispatch(toggleMobileMenu())}
                className="rounded-lg px-4 py-3.5 text-[15px] text-ink transition-colors hover:bg-mist"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-1 border-t border-line pt-3">
              <Link
                href={user ? '/account/profile' : '/auth/login'}
                onClick={() => dispatch(toggleMobileMenu())}
                className="rounded-lg px-4 py-3.5 text-[15px] text-slate transition-colors hover:bg-mist"
              >
                {user ? user.name : 'Sign in'}
              </Link>
              <Link
                href="/account/wishlist"
                onClick={() => dispatch(toggleMobileMenu())}
                className="rounded-lg px-4 py-3.5 text-[15px] text-slate transition-colors hover:bg-mist"
              >
                Saved items
              </Link>
              {dashboardHref && (
                <Link
                  href={dashboardHref}
                  onClick={() => dispatch(toggleMobileMenu())}
                  className="rounded-lg px-4 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-mist"
                >
                  {isAdmin ? 'Admin dashboard' : 'Staff dashboard'}
                </Link>
              )}
              <Link
                href="/bookings"
                onClick={() => dispatch(toggleMobileMenu())}
                className="btn btn-primary mx-1 mt-2"
              >
                Book an appointment
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
