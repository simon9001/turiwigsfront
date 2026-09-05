'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, ShoppingBag, BookOpen, Package, Users,
  LogOut, Menu, ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: 'admin' | 'staff';
}

export { LayoutDashboard, ShoppingBag, BookOpen, Package, Users };

// ─── Shell tokens ─────────────────────────────────────────────────────────────
// The sidebar is a dark surface, so everything drawn on it is a white tint.
// The main pane is light, so its tints are ink.

const SIDEBAR_BG = 'linear-gradient(175deg, #1f1d1a 0%, #171614 55%, #121110 100%)';

const ACTIVE_NAV: React.CSSProperties = {
  background: 'rgba(255,255,255,0.10)',
  borderLeft: '3px solid #ffffff',
  color: '#ffffff',
};

const INACTIVE_NAV: React.CSSProperties = {
  color: 'rgba(255,255,255,0.55)',
  borderLeft: '3px solid transparent',
};

const COLLAPSE_BTN: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--line-2)',
  color: '#171614',
};

const HEADER_STYLE: React.CSSProperties = {
  background: '#ffffff',
  borderBottom: '1px solid var(--line)',
};

const MAIN_BG: React.CSSProperties = {
  background: '#f4f4f2',
};

const AVATAR_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.22)',
  color: '#ffffff',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function DashboardShell({ children, navItems, role }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/');

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // A plain element, not a component defined during render — declaring a
  // component inside the parent gives it a new identity every render, which
  // remounts the whole sidebar and drops its state.
  const sidebar = (
    <div className="flex h-full flex-col"
      style={{ borderRight: '1px solid rgba(255,255,255,0.10)' }}>

      {/* Brand bar */}
      <div
        className={cn('flex h-16 flex-shrink-0 items-center gap-3 px-4 flex-shrink-0')}
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.10)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 5px rgba(0,0,0,0.32)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}>
          <ShieldCheck className="h-4 w-4"
            style={{ color: '#ffffff' }} />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-none">
            <p className="text-sm font-bold tracking-wide"
              style={{ color: '#ffffff' }}>
              Tiuri
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              {role === 'admin' ? 'Admin Panel' : 'Staff Panel'}
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-0'
              )}
              style={active ? ACTIVE_NAV : INACTIVE_NAV}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate"
                  style={active ? { textShadow: '0 1px 2px rgba(0,0,0,0.35)' } : {}}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 p-3 space-y-1"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.35)',
          
        }}>
        {!collapsed && user && (
          <div className="px-3 py-2.5 rounded-xl mb-1"
            style={{
              background: 'rgba(255,255,255,0.04)',
              boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.22), inset 0 -1px 0 rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
            <p className="truncate text-sm font-semibold"
              style={{ color: 'rgba(255,255,255,0.85)' }}>
              {user.name || user.email}
            </p>
            <p className="truncate text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
            collapsed && 'justify-center px-0'
          )}
          style={{ color: 'rgba(255,255,255,0.32)', borderLeft: '3px solid transparent' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = '#f87171';
            el.style.background = 'rgba(239,68,68,0.09)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.color = 'rgba(255,255,255,0.32)';
            el.style.background = 'transparent';
          }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-screen" style={MAIN_BG}>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'relative hidden md:flex flex-col flex-shrink-0 transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-60'
        )}
        style={{ background: SIDEBAR_BG }}
      >
        {sidebar}

        {/* Collapse toggle — polished coin */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-100 active:scale-90"
          style={COLLAPSE_BTN}
          aria-label="Toggle sidebar"
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
            : <ChevronLeft className="h-3 w-3" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/62 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col"
            style={{ background: SIDEBAR_BG }}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 min-w-0 flex-col">

        {/* Top bar — polished ivory */}
        <header
          className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-4 px-4 sm:px-6"
          style={HEADER_STYLE}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden rounded-xl p-2 transition-all active:scale-95"
            style={{ color: '#6e6b65' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page breadcrumb */}
          <span className="hidden md:block text-sm font-semibold"
            style={{ color: '#3f3d39', textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>
            {navItems.find((n) => isActive(n))?.label ?? 'Dashboard'}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:block text-right leading-none">
                  <p className="text-sm font-semibold"
                    style={{ color: '#2e2c28', textShadow: '0 1px 0 rgba(255,255,255,0.9)' }}>
                    {user.name || user.email}
                  </p>
                  <p className="text-[10px] capitalize mt-0.5" style={{ color: '#8b8881' }}>
                    {user.role}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={AVATAR_STYLE}>
                  {(user.name || user.email || 'A')[0].toUpperCase()}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
