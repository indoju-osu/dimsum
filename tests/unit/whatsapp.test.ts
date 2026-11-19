/**
 * Unit test: pembuatan tautan & pesan WhatsApp (src/lib/whatsapp.ts).
 *
 * Fokus: nomor tidak pernah dikarang, format wa.me benar, pesan ter-encode,
 * dan nomor yang tidak valid menghasilkan null.
 */
import { describe, it, expect } from 'vitest';
import {
  buildGeneralInquiryMessage,
  buildOrderMessage,
  buildProductInquiryMessage,
  buildWhatsAppUrl,
} from '@/lib/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('membentuk tautan wa.me dengan pesan ter-encode', () => {
    const url = buildWhatsAppUrl('0812-3456-7890', 'Halo, saya mau pesan dimsum');
    expect(url).toBe(
      'https://wa.me/081234567890?text=Halo%2C%20saya%20mau%20pesan%20dimsum',
    );
  });

  it('meng-encode karakter khusus, newline, dan ampersand', () => {
    const url = buildWhatsAppUrl('628123456789', 'Pesanan #1\n2 x 25.000 = 50.000 & ongkir');
    expect(url).toContain('%0A');
    expect(url).toContain('%26');
    expect(url?.startsWith('https://wa.me/628123456789?text=')).toBe(true);
  });

  it('menolak nomor yang terlalu pendek, terlalu panjang, atau kosong', () => {
    expect(buildWhatsAppUrl('', 'hai')).toBeNull();
    expect(buildWhatsAppUrl('12345', 'hai')).toBeNull();
    expect(buildWhatsAppUrl('1234567890123456789', 'hai')).toBeNull();
    expect(buildWhatsAppUrl('tanpa-angka', 'hai')).toBeNull();
  });
});

describe('buildOrderMessage', () => {
  const message = buildOrderMessage({
    brandName: 'Dimsum Kita',
    orderNumber: 'DM-20261119-0001',
    customerName: 'Budi',
    customerPhone: '08123456789',
    fulfillment: 'DELIVERY',
    address: 'Jl. Contoh No. 1, Jakarta',
    note: 'Jangan pedas',
    items: [
      { name: 'Dimsum Ayam Original', variantName: 'Kukus', quantity: 2, unitPrice: 25000, subtotal: 50000 },
      { name: 'Dimsum Mentai', variantName: null, quantity: 1, unitPrice: 32000, subtotal: 32000 },
    ],
    subtotal: 82000,
    shippingCost: 15000,
    total: 97000,
    storeAddress: 'Alamat toko',
    priceUpdateNote: 'Catatan harga',
  });

  it('memuat identitas toko, daftar item, varian, dan total', () => {
    expect(message).toContain('Halo Dimsum Kita');
    expect(message).toContain('1. Dimsum Ayam Original (Kukus)');
    expect(message).toContain('2 x Rp25.000 = Rp50.000');
    expect(message).toContain('Subtotal: Rp82.000');
    expect(message).toContain('Total perkiraan: Rp97.000');
  });

  it('memuat data pemesan, alamat pengiriman, dan kode pesanan', () => {
    expect(message).toContain('Nama: Budi');
    expect(message).toContain('No. WhatsApp: 08123456789');
    expect(message).toContain('Metode: Pengiriman');
    expect(message).toContain('Alamat: Jl. Contoh No. 1, Jakarta');
    expect(message).toContain('Catatan: Jangan pedas');
    expect(message).toContain('Kode pesanan: DM-20261119-0001');
    expect(message).toContain('Catatan Sistem');
  });

  it('menyebut ongkir dikonfirmasi admin saat biaya kirim belum diketahui', () => {
    const pickupMessage = buildOrderMessage({
      brandName: 'Dimsum Kita',
      customerName: 'Sari',
      customerPhone: '08123456789',
      fulfillment: 'DELIVERY',
      items: [{ name: 'Dimsum Udang', quantity: 1, unitPrice: 30000, subtotal: 30000 }],
      subtotal: 30000,
      shippingCost: 0,
      total: 30000,
      storeAddress: 'Jl. Contoh No. 1',
      pickupNote: null,
    });
    expect(pickupMessage).toContain('Ongkos kirim: dikonfirmasi admin sesuai alamat');
  });

  it('memakai metode ambil sendiri beserta lokasi toko', () => {
    const pickupMessage = buildOrderMessage({
      brandName: 'Dimsum Kita',
      customerName: 'Sari',
      customerPhone: '08123456789',
      fulfillment: 'PICKUP',
      items: [{ name: 'Dimsum Udang', quantity: 1, unitPrice: 30000, subtotal: 30000 }],
      subtotal: 30000,
      shippingCost: 0,
      total: 30000,
      storeAddress: 'Jl. Contoh No. 1',
    });
    expect(pickupMessage).toContain('Metode: Ambil sendiri di toko');
    expect(pickupMessage).toContain('Lokasi ambil: Jl. Contoh No. 1');
  });
});

describe('pesan pertanyaan umum', () => {
  it('menyebut nama brand dan tidak berisi nomor telepon', () => {
    const text = buildGeneralInquiryMessage('Dimsum Kita');
    expect(text).toContain('Dimsum Kita');
    expect(/\d{6,}/.test(text)).toBe(false);
  });

  it('menyertakan nama produk dan tautan pada pesan produk', () => {
    const text = buildProductInquiryMessage('Dimsum Kita', 'Dimsum Mentai', 'https://contoh.test/products/dimsum-mentai');
    expect(text).toContain('Dimsum Mentai');
    expect(text).toContain('https://contoh.test/products/dimsum-mentai');
  });
});
