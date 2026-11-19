'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

/** Badge keranjang pada header. Jumlah hanya dirender setelah data dimuat. */
export function CartBadge({ className }: { className?: string }) {
  const { itemCount, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      className={cn(
        'relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-forest/20 bg-white px-3 text-forest transition hover:border-forest/40 hover:bg-stone/60',
        className,
      )}
      aria-label={hydrated && itemCount > 0 ? `Keranjang, ${itemCount} item` : 'Keranjang belanja'}
    >
      <ShoppingBag aria-hidden className="h-5 w-5" />
      <span className="hidden text-sm font-semibold sm:inline">Keranjang</span>
      {hydrated && itemCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-harvest px-1.5 text-xs font-bold text-forest">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </Link>
  );
}

export default CartBadge;
