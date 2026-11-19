/**
 * Integration test: POST /api/cart/validate.
 *
 * Menguji jalur lengkap route handler + validasi Zod + revalidasi harga/stok
 * server (src/lib/order.ts) dengan lapisan database dimock, sehingga harga dan
 * stok akhir selalu berasal dari server — bukan dari yang dikirim browser.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { product: { findMany: vi.fn() } },
}));

import { POST } from '@/app/api/cart/validate/route';
import { prisma } from '@/lib/prisma';
import { CART_NOTICE_MESSAGE } from '@/lib/cart';

const findMany = vi.mocked(prisma.product.findMany);

type MockProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isPublished: boolean;
  isAvailable: boolean;
  variants: {
    id: string;
    name: string;
    priceAdjustment: number;
    isDefault: boolean;
  }[];
};

function product(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: 'p1',
    slug: 'dimsum-ayam-original-5-pcs',
    name: 'Dimsum Ayam Original',
    image: '/images/products/dimsum-ayam-original-5-pcs.webp',
    price: 25000,
    discountPrice: null,
    stock: 10,
    isPublished: true,
    isAvailable: true,
    variants: [{ id: 'v1', name: 'Kukus', priceAdjustment: 0, isDefault: true }],
    ...overrides,
  };
}

function mockProducts(products: MockProduct[]) {
  findMany.mockResolvedValue(products as never);
}

function request(body: unknown, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/cart/validate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      host: 'localhost:3000',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  findMany.mockReset();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('POST /api/cart/validate', () => {
  it('mengabaikan harga kiriman browser dan memakai harga database', async () => {
    mockProducts([product({ price: 25000 })]);

    const response = await POST(
      request({
        items: [{ productId: 'p1', variantId: 'v1', quantity: 2, expectedUnitPrice: 1 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.items[0].unitPrice).toBe(25000);
    expect(body.pricing.subtotal).toBe(50000);
    expect(body.items[0].requestedQuantity).toBe(2);
    expect(body.items[0].priceChanged).toBe(true);
    expect(body.notice.priceUpdated).toBe(true);
  });

  it('menyesuaikan jumlah dengan stok tersedia dan mengirim notifikasi stok', async () => {
    mockProducts([product({ stock: 3 })]);

    const response = await POST(
      request({ items: [{ productId: 'p1', variantId: 'v1', quantity: 9, expectedUnitPrice: 25000 }] }),
    );
    const body = await response.json();

    expect(body.items[0].quantity).toBe(3);
    expect(body.items[0].stockAdjusted).toBe(true);
    expect(body.notice.stockAdjusted).toBe(true);
    expect(body.notice.adjustedNames).toContain('Dimsum Ayam Original');
    expect(CART_NOTICE_MESSAGE.stockAdjusted).toBe(
      'Terdapat perubahan stok. Jumlah produk dalam keranjang telah disesuaikan.',
    );
  });

  it('menghapus produk yang tidak tersedia, tidak dipublikasikan, atau stok habis', async () => {
    mockProducts([
      product({ id: 'p2', name: 'Produk Nonaktif', isAvailable: false }),
      product({ id: 'p3', name: 'Produk Habis', stock: 0 }),
    ]);

    const response = await POST(
      request({
        items: [
          { productId: 'p2', quantity: 1 },
          { productId: 'p3', quantity: 1 },
          { productId: 'tidak-ada', quantity: 1 },
        ],
      }),
    );
    const body = await response.json();

    expect(body.items).toHaveLength(0);
    expect(body.notice.removed).toBe(true);
    expect(body.notice.removedNames).toEqual(['Produk Nonaktif', 'Produk Habis']);
    expect(body.pricing.subtotal).toBe(0);
  });

  it('tidak mengirim notifikasi ketika harga dan stok sudah sesuai', async () => {
    mockProducts([product({ stock: 10 })]);

    const response = await POST(
      request({ items: [{ productId: 'p1', variantId: 'v1', quantity: 2, expectedUnitPrice: 25000 }] }),
    );
    const body = await response.json();

    expect(body.notice.priceUpdated).toBe(false);
    expect(body.notice.stockAdjusted).toBe(false);
    expect(body.notice.removed).toBe(false);
    expect(body.items[0].variantName).toBe('Kukus');
  });

  it('menambahkan penyesuaian harga varian ke harga satuan', async () => {
    mockProducts([
      product({
        id: 'p4',
        name: 'Dimsum Mentai',
        price: 32000,
        variants: [
          { id: 'v-default', name: 'Original', priceAdjustment: 0, isDefault: true },
          { id: 'v-extra', name: 'Extra Mentai', priceAdjustment: 5000, isDefault: false },
        ],
      }),
    ]);

    const response = await POST(
      request({ items: [{ productId: 'p4', variantId: 'v-extra', quantity: 1, expectedUnitPrice: 32000 }] }),
    );
    const body = await response.json();

    expect(body.items[0].unitPrice).toBe(37000);
    expect(body.items[0].variantName).toBe('Extra Mentai');
    expect(body.notice.priceUpdated).toBe(true);
  });

  it('menolak permintaan dari origin lain (CSRF) tanpa menyentuh database', async () => {
    mockProducts([product()]);

    const response = await POST(
      request({ items: [{ productId: 'p1', quantity: 1 }] }, 'https://situs-jahat.test'),
    );

    expect(response.status).toBe(403);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('menolak body yang tidak valid dengan status 400', async () => {
    const response = await POST(request({ items: [] }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Data keranjang tidak valid.');
  });

  it('menolak body yang bukan JSON dengan status 400', async () => {
    const response = await POST(request('{bukan-json'));
    expect(response.status).toBe(400);
  });
});
