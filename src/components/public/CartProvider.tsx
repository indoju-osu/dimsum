'use client';

import { CartContext, useCartState } from '@/hooks/useCart';

/**
 * Menyediakan state keranjang ke seluruh aplikasi (header, halaman katalog,
 * halaman keranjang, dan checkout).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const value = useCartState();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
