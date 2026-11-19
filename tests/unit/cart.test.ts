/**
 * Unit test: logika keranjang di browser (src/lib/cart.ts).
 *
 * Fokus: pembatasan jumlah, perhitungan harga, penggabungan baris
 * produk+varian, dan migrasi data localStorage yang rusak.
 */
import { describe, it, expect } from 'vitest';
import {
  CART_NOTICE_MESSAGE,
  cartItemKey,
  clampCartQuantity,
  computePricing,
  parseStoredCart,
  removeCartLine,
  updateCartLineQuantity,
  upsertCartLine,
} from '@/lib/cart';
import { CART_MAX_QUANTITY } from '@/lib/constants';
import type { CartLine } from '@/types';

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p1',
    slug: 'dimsum-ayam-original-5-pcs',
    name: 'Dimsum Ayam Original',
    image: '/images/products/dimsum-ayam-original-5-pcs.webp',
    variantId: null,
    variantName: null,
    unitPrice: 25000,
    quantity: 1,
    addedAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe('CART_NOTICE_MESSAGE', () => {
  it('memakai teks notifikasi persis sesuai spesifikasi', () => {
    expect(CART_NOTICE_MESSAGE.priceUpdated).toBe(
      'Harga beberapa produk telah diperbarui. Silakan periksa kembali pesanan Anda.',
    );
    expect(CART_NOTICE_MESSAGE.stockAdjusted).toBe(
      'Terdapat perubahan stok. Jumlah produk dalam keranjang telah disesuaikan.',
    );
    expect(CART_NOTICE_MESSAGE.removed).toBe(
      'Maaf, produk ini sudah tidak tersedia dan telah dihapus dari keranjang.',
    );
  });
});

describe('cartItemKey', () => {
  it('membedakan produk tanpa varian dan dengan varian', () => {
    expect(cartItemKey('p1', null)).toBe('p1');
    expect(cartItemKey('p1', undefined)).toBe('p1');
    expect(cartItemKey('p1', 'v1')).toBe('p1::v1');
  });
});

describe('clampCartQuantity', () => {
  it('membatasi nilai minimum 1 dan maksimum CART_MAX_QUANTITY', () => {
    expect(clampCartQuantity(0)).toBe(1);
    expect(clampCartQuantity(-7)).toBe(1);
    expect(clampCartQuantity(999)).toBe(CART_MAX_QUANTITY);
    expect(clampCartQuantity(Number.NaN)).toBe(1);
    expect(clampCartQuantity(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('membulatkan ke bilangan bulat', () => {
    expect(clampCartQuantity(2.9)).toBe(2);
  });
});

describe('computePricing', () => {
  it('menjumlahkan subtotal, jumlah barang, dan jumlah baris', () => {
    const pricing = computePricing([
      line({ quantity: 2, unitPrice: 25000 }),
      line({ productId: 'p2', variantId: 'v1', quantity: 1, unitPrice: 30000 }),
    ]);
    expect(pricing).toEqual({ subtotal: 80000, totalQuantity: 3, totalItems: 2 });
  });

  it('mengembalikan nol untuk keranjang kosong', () => {
    expect(computePricing([])).toEqual({ subtotal: 0, totalQuantity: 0, totalItems: 0 });
  });
});

describe('upsertCartLine', () => {
  it('menambahkan baris baru tanpa memutasi array asli', () => {
    const original: CartLine[] = [];
    const next = upsertCartLine(original, line({ quantity: 3 }));
    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(3);
    expect(original).toHaveLength(0);
  });

  it('menggabungkan baris dengan produk & varian yang sama', () => {
    const next = upsertCartLine(
      [line({ quantity: 2, unitPrice: 25000 })],
      line({ quantity: 3, unitPrice: 27000 }),
    );
    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(5);
    // Harga selalu diperbarui dari data terbaru yang dikirim pemanggil.
    expect(next[0]?.unitPrice).toBe(27000);
  });

  it('memperlakukan varian berbeda sebagai baris terpisah', () => {
    const next = upsertCartLine(
      [line({ variantId: 'v1', variantName: 'Kukus' })],
      line({ variantId: 'v2', variantName: 'Goreng' }),
    );
    expect(next).toHaveLength(2);
  });

  it('tidak melewati CART_MAX_QUANTITY saat digabung', () => {
    const next = upsertCartLine(
      [line({ quantity: CART_MAX_QUANTITY })],
      line({ quantity: 5 }),
    );
    expect(next[0]?.quantity).toBe(CART_MAX_QUANTITY);
  });
});

describe('updateCartLineQuantity & removeCartLine', () => {
  it('menghapus baris ketika jumlah <= 0', () => {
    const lines = [line({ quantity: 1 })];
    expect(updateCartLineQuantity(lines, 'p1', null, 0)).toHaveLength(0);
    expect(updateCartLineQuantity(lines, 'p1', null, -3)).toHaveLength(0);
  });

  it('memperbarui jumlah hanya pada baris yang cocok', () => {
    const lines = [line({ quantity: 1 }), line({ productId: 'p2', quantity: 2 })];
    const next = updateCartLineQuantity(lines, 'p2', null, 4);
    expect(next[0]?.quantity).toBe(1);
    expect(next[1]?.quantity).toBe(4);
  });

  it('tidak menghapus baris dengan varian berbeda', () => {
    const lines = [line({ variantId: 'v1' }), line({ variantId: 'v2' })];
    const next = removeCartLine(lines, 'p1', 'v1');
    expect(next).toHaveLength(1);
    expect(next[0]?.variantId).toBe('v2');
  });
});

describe('parseStoredCart', () => {
  it('mengembalikan array kosong untuk nilai kosong atau JSON rusak', () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart('')).toEqual([]);
    expect(parseStoredCart('{bukan json')).toEqual([]);
    expect(parseStoredCart('{"a":1}')).toEqual([]);
  });

  it('menyaring entri yang tidak lengkap', () => {
    const raw = JSON.stringify([
      { productId: 'p1', slug: 's', name: 'N', unitPrice: 1000, quantity: 2 },
      { productId: '', slug: 's', name: 'N', unitPrice: 1000, quantity: 2 },
      { productId: 'p2', slug: 's', name: 'N', unitPrice: 'gratis', quantity: 2 },
      null,
    ]);
    const parsed = parseStoredCart(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.productId).toBe('p1');
  });

  it('membatasi jumlah dan membersihkan nilai negatif', () => {
    const raw = JSON.stringify([
      { productId: 'p1', slug: 's', name: 'N', unitPrice: -500, quantity: 900 },
    ]);
    const parsed = parseStoredCart(raw);
    expect(parsed[0]?.unitPrice).toBe(0);
    expect(parsed[0]?.quantity).toBe(CART_MAX_QUANTITY);
  });
});
