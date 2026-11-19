/**
 * Utilitas keranjang belanja (aman dipakai di client maupun server).
 *
 * Keranjang disimpan di browser (localStorage) sebagai sumber UX, tetapi setiap
 * harga, ketersediaan, dan stok SELALU divalidasi ulang oleh server melalui
 * `POST /api/cart/validate` dan lagi saat pesanan dibuat (`POST /api/orders`).
 * Harga dari client tidak pernah dipercaya.
 */
import { CART_MAX_QUANTITY } from './constants';
import type { CartLine, CartPricing } from '../types';

/** Pesan notifikasi persis sesuai spesifikasi produk. */
export const CART_NOTICE_MESSAGE = {
  priceUpdated: 'Harga beberapa produk telah diperbarui. Silakan periksa kembali pesanan Anda.',
  stockAdjusted: 'Terdapat perubahan stok. Jumlah produk dalam keranjang telah disesuaikan.',
  removed: 'Maaf, produk ini sudah tidak tersedia dan telah dihapus dari keranjang.',
} as const;

export const CART_NOTICE_TITLE = {
  priceUpdated: 'Harga diperbarui',
  stockAdjusted: 'Stok disesuaikan',
  removed: 'Produk tidak tersedia',
} as const;

/** Kunci unik baris keranjang: kombinasi produk dan varian. */
export function cartItemKey(productId: string, variantId: string | null | undefined): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function clampCartQuantity(quantity: number, max = CART_MAX_QUANTITY): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), max);
}

export function computePricing(lines: CartLine[]): CartPricing {
  return lines.reduce<CartPricing>(
    (accumulator, line) => ({
      subtotal: accumulator.subtotal + line.unitPrice * line.quantity,
      totalQuantity: accumulator.totalQuantity + line.quantity,
      totalItems: accumulator.totalItems + 1,
    }),
    { subtotal: 0, totalQuantity: 0, totalItems: 0 },
  );
}

/** Tambah / perbarui baris pada keranjang tanpa memutasi array asli. */
export function upsertCartLine(lines: CartLine[], incoming: CartLine): CartLine[] {
  const key = cartItemKey(incoming.productId, incoming.variantId);
  const existingIndex = lines.findIndex(
    (line) => cartItemKey(line.productId, line.variantId) === key,
  );

  if (existingIndex === -1) {
    return [...lines, { ...incoming, quantity: clampCartQuantity(incoming.quantity) }];
  }

  const existing = lines[existingIndex] as CartLine;
  const nextQuantity = clampCartQuantity(existing.quantity + incoming.quantity);
  const nextLines = [...lines];
  nextLines[existingIndex] = {
    ...existing,
    // Harga & info produk diperbarui dari data terbaru yang dikirim pemanggil.
    unitPrice: incoming.unitPrice,
    name: incoming.name,
    image: incoming.image,
    variantName: incoming.variantName,
    quantity: nextQuantity,
  };
  return nextLines;
}

export function updateCartLineQuantity(
  lines: CartLine[],
  productId: string,
  variantId: string | null,
  quantity: number,
): CartLine[] {
  const key = cartItemKey(productId, variantId);
  if (quantity <= 0) return removeCartLine(lines, productId, variantId);
  return lines.map((line) =>
    cartItemKey(line.productId, line.variantId) === key
      ? { ...line, quantity: clampCartQuantity(quantity) }
      : line,
  );
}

export function removeCartLine(
  lines: CartLine[],
  productId: string,
  variantId: string | null,
): CartLine[] {
  const key = cartItemKey(productId, variantId);
  return lines.filter((line) => cartItemKey(line.productId, line.variantId) !== key);
}

/** Payload minimal yang dikirim ke server untuk validasi harga & stok. */
export function toValidationPayload(lines: CartLine[]) {
  return lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId ?? undefined,
    quantity: line.quantity,
  }));
}

/**
 * Migrasikan data localStorage dari versi sebelumnya / data korup.
 * Mengembalikan hanya baris dengan bentuk yang diharapkan.
 */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== 'object' || entry === null) return [];
      const record = entry as Record<string, unknown>;
      const productId = typeof record.productId === 'string' ? record.productId : '';
      const slug = typeof record.slug === 'string' ? record.slug : '';
      const name = typeof record.name === 'string' ? record.name : '';
      const unitPrice = typeof record.unitPrice === 'number' ? record.unitPrice : NaN;
      const quantity = typeof record.quantity === 'number' ? record.quantity : NaN;
      if (!productId || !slug || !name || !Number.isFinite(unitPrice) || !Number.isFinite(quantity)) {
        return [];
      }
      return [
        {
          productId,
          slug,
          name,
          image: typeof record.image === 'string' ? record.image : '',
          variantId: typeof record.variantId === 'string' ? record.variantId : null,
          variantName: typeof record.variantName === 'string' ? record.variantName : null,
          unitPrice: Math.max(0, Math.trunc(unitPrice)),
          quantity: clampCartQuantity(quantity),
          addedAt: typeof record.addedAt === 'number' ? record.addedAt : Date.now(),
        },
      ];
    });
  } catch {
    return [];
  }
}
