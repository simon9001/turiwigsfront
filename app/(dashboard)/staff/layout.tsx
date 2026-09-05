'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  LayoutDashboard, ShoppingBag, DollarSign,
  Calendar, UserCircle, MessageSquare,
} from 'lucide-react';
import { schedulingApi } from '@/api/scheduling.api';
import type { NavItem } from '@/components/dashboard/DashboardShell';
import type { BusinessSettings } from '@/types';

const BASE_NAV: NavItem[] = [
  { label: 'My Dashboard',  href: '/staff',              icon: LayoutDashboard, exact: true },
  { label: 'My Schedule',   href: '/staff/bookings',     icon: Calendar },
  { label: 'Commissions',   href: '/staff/commissions',  icon: DollarSign },
  { label: 'Client Notes',  href: '/staff/client-notes', icon: MessageSquare },
  { label: 'My Profile',    href: '/staff/profile',      icon: UserCircle },
];

const ORDERS_NAV: NavItem = { label: 'Orders', href: '/staff/orders', icon: ShoppingBag };

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isDashboardUser, loading, isAuthenticated } = useRole();
  const [nav, setNav] = useState<NavItem[]>(BASE_NAV);

  useEffect(() => {
    schedulingApi.getSettings()
      .then(({ data }) => {
        const s = data.data as (BusinessSettings & { staff_orders_enabled?: boolean }) | null;
        const ordersEnabled = s?.staff_orders_enabled ?? true;
        setNav(ordersEnabled
          ? [BASE_NAV[0], BASE_NAV[1], ORDERS_NAV, ...BASE_NAV.slice(2)]
          : BASE_NAV
        );
      })
      .catch(() => {
        // On error, show orders by default
        setNav([BASE_NAV[0], BASE_NAV[1], ORDERS_NAV, ...BASE_NAV.slice(2)]);
      });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (!isDashboardUser) { router.replace('/'); }
  }, [loading, isAuthenticated, isDashboardUser, router]);

  if (loading || !isDashboardUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <PageSpinner />
      </div>
    );
  }

  return <DashboardShell navItems={nav} role="staff">{children}</DashboardShell>;
}
