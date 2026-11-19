'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileNavItem = { href: string; label: string };
export type MobileNavCategory = { name: string; slug: string };

/**
 * Menu hamburger untuk layar kecil. Drawer dapat ditutup dengan tombol Escape,
 * klik backdrop, atau memilih tautan; fokus dikembalikan ke tombol pembuka.
 */
export function MobileNav({
  items,
  categories,
  whatsappUrl,
}: {
  items: MobileNavItem[];
  categories: MobileNavCategory[];
  whatsappUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Tutup drawer setiap kali rute berubah.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu navigasi"
        aria-expanded={open}
        aria-controls="menu-mobile"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-forest/20 bg-white text-forest transition hover:bg-stone/60 lg:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 h-full w-full bg-forest/50"
            onClick={() => setOpen(false)}
          />
          <div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-fade-in flex-col bg-white shadow-card"
          >
            <div className="flex items-center justify-between border-b border-stone px-4 py-3">
              <p className="font-display text-lg text-forest">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-forest transition hover:bg-stone"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Navigasi utama (mobile)" className="flex-1 overflow-y-auto px-2 py-3">
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex min-h-[44px] items-center rounded-xl px-3 text-base font-medium text-forest transition hover:bg-stone/70',
                        pathname === item.href && 'bg-stone/80',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {categories.length > 0 ? (
                <div className="mt-4 border-t border-stone pt-4">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-olive">
                    Kategori
                  </p>
                  <ul className="mt-2 space-y-1">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="flex min-h-[44px] items-center rounded-xl px-3 text-sm text-charcoal transition hover:bg-stone/70"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </nav>

            {whatsappUrl ? (
              <div className="border-t border-stone p-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-4 font-semibold text-white"
                >
                  <MessageCircle aria-hidden className="h-5 w-5" />
                  Pesan via WhatsApp
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MobileNav;
