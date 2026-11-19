'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpenCheck,
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  X,
} from 'lucide-react';
import { ADMIN_NAV } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard aria-hidden className="h-[18px] w-[18px]" />,
  products: <Package aria-hidden className="h-[18px] w-[18px]" />,
  categories: <Tags aria-hidden className="h-[18px] w-[18px]" />,
  orders: <ShoppingBag aria-hidden className="h-[18px] w-[18px]" />,
  articles: <BookOpenCheck aria-hidden className="h-[18px] w-[18px]" />,
  testimonials: <MessageSquareQuote aria-hidden className="h-[18px] w-[18px]" />,
  settings: <Settings aria-hidden className="h-[18px] w-[18px]" />,
};

/**
 * Kerangka dashboard admin: sidebar (desktop), drawer (mobile), dan tombol
 * logout. Logout memanggil /api/auth/logout sehingga cookie sesi dihapus di
 * server; setelah itu pengguna kembali ke halaman login.
 */
export function AdminShell({
  username,
  brandName,
  pendingOrderCount,
  children,
}: {
  username: string;
  brandName: string;
  pendingOrderCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        const payload: { error?: string } = await response.json().catch(() => ({}));
        toast.error('Logout gagal', payload.error ?? 'Silakan coba lagi.');
        return;
      }
      toast.success('Anda telah keluar', 'Sesi admin diakhiri.');
      router.replace('/admin/login');
      router.refresh();
    } catch {
      toast.error('Logout gagal', 'Tidak dapat menghubungi server.');
    } finally {
      setLoggingOut(false);
    }
  }

  const nav = (
    <nav aria-label="Navigasi admin" className="space-y-1">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200',
              active
                ? 'bg-forest text-white'
                : 'text-forest/85 hover:bg-stone/70 hover:text-forest',
            )}
          >
            <span className="flex items-center gap-2.5">
              {ICONS[item.icon] ?? <Boxes aria-hidden className="h-[18px] w-[18px]" />}
              {item.label}
            </span>
            {item.href === '/admin/orders' && pendingOrderCount > 0 ? (
              <span className="rounded-full bg-harvest px-2 py-0.5 text-xs font-semibold text-forest">
                {pendingOrderCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-stone bg-white px-4 py-6 lg:flex">
        <div className="space-y-6">
          <div className="px-2">
            <Link href="/admin" className="font-display text-xl text-forest">
              {brandName}
            </Link>
            <p className="text-xs uppercase tracking-[0.18em] text-charcoal/60">Dashboard Admin</p>
          </div>
          {nav}
        </div>
        <div className="space-y-2 border-t border-stone pt-4">
          <ButtonLink href="/" variant="ghost" size="sm" className="w-full justify-start">
            <ExternalLink aria-hidden className="h-4 w-4" />
            Lihat toko
          </ButtonLink>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
            loading={loggingOut}
          >
            <LogOut aria-hidden className="h-4 w-4" />
            {loggingOut ? 'Keluar…' : 'Logout'}
          </Button>
          <p className="px-2 text-xs text-charcoal/60">Masuk sebagai {username}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-stone bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
          <div>
            <p className="font-display text-lg text-forest">{brandName}</p>
            <p className="text-xs text-charcoal/70">Dashboard admin</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {drawerOpen ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
            {drawerOpen ? 'Tutup' : 'Menu'}
          </Button>
        </header>

        {drawerOpen ? (
          <div id="admin-drawer" className="border-b border-stone bg-white px-4 py-4 lg:hidden">
            {nav}
            <div className="mt-3 space-y-2 border-t border-stone pt-3">
              <ButtonLink href="/" variant="ghost" size="sm" className="w-full justify-start">
                <ExternalLink aria-hidden className="h-4 w-4" />
                Lihat toko
              </ButtonLink>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleLogout}
                loading={loggingOut}
              >
                <LogOut aria-hidden className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
