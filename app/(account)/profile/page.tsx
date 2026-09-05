'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Calendar, Heart, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PageSpinner } from '@/components/ui/Spinner';

const MENU = [
  { icon: Package, label: 'My Orders', href: '/account/orders' },
  { icon: Calendar, label: 'My Bookings', href: '/account/bookings' },
  { icon: Heart, label: 'Wishlist', href: '/account/wishlist' },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, loading, router]);

  if (loading || !user) return <PageSpinner />;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Avatar + name */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white text-xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{user.name}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 capitalize">
            {user.role}
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        {MENU.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-neutral-200 px-5 py-4 hover:border-neutral-400 hover:bg-neutral-50 transition-all"
          >
            <Icon className="h-5 w-5 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-900">{label}</span>
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-4 rounded-2xl border border-red-100 px-5 py-4 hover:bg-red-50 transition-colors text-left"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-600">Sign Out</span>
        </button>
      </nav>
    </div>
  );
}
