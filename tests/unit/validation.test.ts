/**
 * Unit test: skema validasi Zod (src/lib/validation.ts).
 *
 * Fokus: data tidak valid dari browser harus ditolak sebelum menyentuh database.
 */
import { describe, it, expect } from 'vitest';
import {
  cartValidationSchema,
  loginSchema,
  orderInputSchema,
  settingsInputSchema,
} from '@/lib/validation';

describe('loginSchema', () => {
  it('menolak username/password kosong', () => {
    expect(loginSchema.safeParse({ username: '', password: '' }).success).toBe(false);
  });

  it('menerima kredensial dengan panjang wajar', () => {
    expect(loginSchema.safeParse({ username: 'admin', password: 'admin' }).success).toBe(true);
  });
});

describe('cartValidationSchema', () => {
  it('menolak keranjang kosong', () => {
    expect(cartValidationSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it('menolak jumlah 0 atau di atas 99', () => {
    expect(
      cartValidationSchema.safeParse({ items: [{ productId: 'p1', quantity: 0 }] }).success,
    ).toBe(false);
    expect(
      cartValidationSchema.safeParse({ items: [{ productId: 'p1', quantity: 100 }] }).success,
    ).toBe(false);
  });

  it('menolak jumlah pecahan', () => {
    expect(
      cartValidationSchema.safeParse({ items: [{ productId: 'p1', quantity: 1.5 }] }).success,
    ).toBe(false);
  });

  it('menerima item valid beserta expectedUnitPrice opsional', () => {
    const result = cartValidationSchema.safeParse({
      items: [{ productId: 'p1', variantId: 'v1', quantity: 2, expectedUnitPrice: 25000 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('orderInputSchema', () => {
  const base = {
    customerName: 'Budi Santoso',
    customerPhone: '08123456789',
    fulfillment: 'PICKUP' as const,
    items: [{ productId: 'p1', quantity: 1 }],
  };

  it('menerima pesanan ambil sendiri tanpa alamat', () => {
    expect(orderInputSchema.safeParse(base).success).toBe(true);
  });

  it('mewajibkan alamat lengkap untuk pengiriman', () => {
    const withoutAddress = orderInputSchema.safeParse({ ...base, fulfillment: 'DELIVERY' });
    expect(withoutAddress.success).toBe(false);

    const shortAddress = orderInputSchema.safeParse({
      ...base,
      fulfillment: 'DELIVERY',
      address: 'Jl. A',
    });
    expect(shortAddress.success).toBe(false);

    const withAddress = orderInputSchema.safeParse({
      ...base,
      fulfillment: 'DELIVERY',
      address: 'Jl. Contoh No. 1, Jakarta Selatan',
    });
    expect(withAddress.success).toBe(true);
  });

  it('menolak nomor WhatsApp yang tidak valid', () => {
    expect(orderInputSchema.safeParse({ ...base, customerPhone: '123' }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...base, customerPhone: 'abcdefghij' }).success).toBe(false);
  });

  it('membersihkan pemisah pada nomor WhatsApp', () => {
    const result = orderInputSchema.safeParse({ ...base, customerPhone: '0812-3456-7890' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.customerPhone).toBe('081234567890');
  });

  it('menolak metode pengambilan yang tidak dikenal', () => {
    expect(orderInputSchema.safeParse({ ...base, fulfillment: 'AMBIL' }).success).toBe(false);
  });
});

describe('settingsInputSchema', () => {
  const base = {
    brandName: 'Dimsum Kita',
    description: 'Deskripsi toko yang cukup panjang untuk validasi.',
    whatsappNumber: '6281234567890',
    shippingCost: 15000,
  };

  it('menerima pengaturan valid', () => {
    expect(settingsInputSchema.safeParse(base).success).toBe(true);
  });

  it('menerima nomor WhatsApp kosong (belum diisi pemilik usaha)', () => {
    expect(settingsInputSchema.safeParse({ ...base, whatsappNumber: '' }).success).toBe(true);
  });

  it('menolak nomor WhatsApp 8 digit atau 16 digit', () => {
    expect(settingsInputSchema.safeParse({ ...base, whatsappNumber: '12345678' }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...base, whatsappNumber: '1'.repeat(16) }).success).toBe(
      false,
    );
  });

  it('menolak ongkos kirim negatif dan nama brand terlalu pendek', () => {
    expect(settingsInputSchema.safeParse({ ...base, shippingCost: -1 }).success).toBe(false);
    expect(settingsInputSchema.safeParse({ ...base, brandName: 'A' }).success).toBe(false);
  });

  it('menolak URL sosial media tanpa skema http', () => {
    expect(settingsInputSchema.safeParse({ ...base, instagram: 'instagram.com/toko' }).success).toBe(
      false,
    );
    expect(
      settingsInputSchema.safeParse({ ...base, instagram: 'https://instagram.com/toko' }).success,
    ).toBe(true);
  });
});
