'use client';

/**
 * Keranjang belanja berbasis React Context + localStorage.
 *
 * Prinsip keamanan: nilai di sini hanya untuk tampilan. Sebelum checkout,
 * `revalidate()` meminta server memverifikasi ulang harga & stok
 * (POST /api/cart/validate) dan hasil server itulah yang dipakai.
 * Saat pesanan dibuat, server memverifikasi ulang sekali lagi.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  computePricing,
  parseStoredCart,
  removeCartLine,
  updateCartLineQuantity,
  upsertCartLine,
} from '@/lib/cart';
import { CART_STORAGE_KEY } from '@/lib/constants';
import type { CartLine, CartNotice, CartPricing, CartValidationResponse } from '@/types';

export type AddToCartInput = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantId?: string | null;
  variantName?: string | null;
  unitPrice: number;
  quantity?: number;
};

export type CartContextValue = {
  lines: CartLine[];
  pricing: CartPricing;
  hydrated: boolean;
  /** Jumlah item untuk badge header. */
  itemCount: number;
  lastNotice: CartNotice | null;
  isRevalidating: boolean;
  addItem: (input: AddToCartInput) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clear: () => void;
  clearNotice: () => void;
  /** Verifikasi ulang harga & stok ke server; mengembalikan hasil validasi. */
  revalidate: () => Promise<CartValidationResponse | null>;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function useCartState(): CartContextValue {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastNotice, setLastNotice] = useState<CartNotice | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const linesRef = useRef<CartLine[]>([]);

  // Muat dari localStorage hanya di browser (menghindari hydration mismatch).
  useEffect(() => {
    setLines(parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    setHydrated(true);
  }, []);

  // Simpan setiap perubahan.
  useEffect(() => {
    linesRef.current = lines;
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch (error) {
      console.error('[cart] Gagal menyimpan keranjang:', error);
    }
  }, [lines, hydrated]);

  // Sinkronkan antar tab.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      setLines(parseStoredCart(event.newValue));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addItem = useCallback((input: AddToCartInput) => {
    setLines((current) =>
      upsertCartLine(current, {
        productId: input.productId,
        slug: input.slug,
        name: input.name,
        image: input.image,
        variantId: input.variantId ?? null,
        variantName: input.variantName ?? null,
        unitPrice: input.unitPrice,
        quantity: input.quantity ?? 1,
        addedAt: Date.now(),
      }),
    );
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
    setLines((current) => updateCartLineQuantity(current, productId, variantId, quantity));
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    setLines((current) => removeCartLine(current, productId, variantId));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setLastNotice(null);
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // abaikan: penyimpanan tidak tersedia (mode privat)
    }
  }, []);

  const clearNotice = useCallback(() => setLastNotice(null), []);

  const revalidate = useCallback(async (): Promise<CartValidationResponse | null> => {
    const currentLines = linesRef.current;
    if (currentLines.length === 0) return null;
    setIsRevalidating(true);
    try {
      const response = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: currentLines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            expectedUnitPrice: line.unitPrice,
          })),
        }),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as CartValidationResponse;

      // Terapkan kebenaran dari server ke keranjang lokal.
      const nextLines: CartLine[] = data.items.map((item) => {
        const existing = currentLines.find(
          (line) => line.productId === item.productId && (line.variantId ?? null) === item.variantId,
        );
        return {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          image: item.image,
          variantId: item.variantId,
          variantName: item.variantName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          addedAt: existing?.addedAt ?? Date.now(),
        };
      });

      linesRef.current = nextLines;
      setLines(nextLines);
      setLastNotice(data.notice);
      return data;
    } catch (error) {
      console.error('[cart] Gagal memverifikasi keranjang:', error);
      return null;
    } finally {
      setIsRevalidating(false);
    }
  }, []);

  const pricing = useMemo(() => computePricing(lines), [lines]);

  return {
    lines,
    pricing,
    hydrated,
    itemCount: pricing.totalQuantity,
    lastNotice,
    isRevalidating,
    addItem,
    setQuantity,
    removeItem,
    clear,
    clearNotice,
    revalidate,
  };
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart harus dipakai di dalam <CartProvider>.');
  }
  return context;
}

export default useCart;
