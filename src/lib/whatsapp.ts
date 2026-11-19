/**
 * Pembuatan tautan WhatsApp Click-to-Chat (wa.me).
 *
 * PENTING:
 * - Nomor WhatsApp TIDAK PERNAH dikarang. Nomor diambil dari pengaturan toko
 *   yang diisi pemilik usaha (`STORE_WHATSAPP` / dashboard admin). Bila belum
 *   diisi, fungsi ini mengembalikan null dan UI menampilkan pemberitahuan.
 * - Tautan hanya dibuka setelah aksi eksplisit dari pengguna (klik tombol),
 *   tidak pernah otomatis.
 */
import { formatRupiah } from './format';

export type WhatsAppOrderItem = {
  name: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type WhatsAppOrderData = {
  brandName: string;
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  fulfillment: 'PICKUP' | 'DELIVERY';
  address?: string | null;
  note?: string | null;
  items: WhatsAppOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  storeAddress?: string | null;
  pickupNote?: string | null;
  priceUpdateNote?: string | null;
  stockAdjustNote?: string | null;
  removedNote?: string | null;
};

/** Susun isi pesan WhatsApp dalam format yang mudah dibaca admin. */
export function buildOrderMessage(data: WhatsAppOrderData): string {
  const lines: string[] = [];

  lines.push(`Halo ${data.brandName}, saya ingin memesan dimsum:`);
  lines.push('');

  data.items.forEach((item, index) => {
    const variant = item.variantName ? ` (${item.variantName})` : '';
    lines.push(`${index + 1}. ${item.name}${variant}`);
    lines.push(`   ${item.quantity} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.subtotal)}`);
  });

  lines.push('');
  lines.push(`Subtotal: ${formatRupiah(data.subtotal)}`);

  if (data.fulfillment === 'DELIVERY') {
    lines.push(
      data.shippingCost > 0
        ? `Ongkos kirim: ${formatRupiah(data.shippingCost)}`
        : 'Ongkos kirim: dikonfirmasi admin sesuai alamat',
    );
  }

  lines.push(`Total perkiraan: ${formatRupiah(data.total)}`);
  lines.push('');

  lines.push('== Data Pemesan ==');
  lines.push(`Nama: ${data.customerName}`);
  lines.push(`No. WhatsApp: ${data.customerPhone}`);

  if (data.fulfillment === 'DELIVERY') {
    lines.push('Metode: Pengiriman');
    if (data.address) lines.push(`Alamat: ${data.address}`);
  } else {
    lines.push('Metode: Ambil sendiri di toko');
    if (data.storeAddress) lines.push(`Lokasi ambil: ${data.storeAddress}`);
    if (data.pickupNote) lines.push(`Catatan pengambilan: ${data.pickupNote}`);
  }

  if (data.note) lines.push(`Catatan: ${data.note}`);
  if (data.orderNumber) lines.push(`Kode pesanan: ${data.orderNumber}`);

  if (data.priceUpdateNote || data.stockAdjustNote || data.removedNote) {
    lines.push('');
    lines.push('== Catatan Sistem ==');
    if (data.priceUpdateNote) lines.push(data.priceUpdateNote);
    if (data.stockAdjustNote) lines.push(data.stockAdjustNote);
    if (data.removedNote) lines.push(data.removedNote);
  }

  lines.push('');
  lines.push('Mohon konfirmasi ketersediaan dan total akhirnya. Terima kasih!');

  return lines.join('\n');
}

/**
 * Bila data pesanan sudah punya nomor pasti, pakai nomor tersebut sehingga
 * urutan pesanan di database sama dengan pesan yang dikirim pelanggan.
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string | null {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  // encodeURIComponent memastikan seluruh karakter khusus (termasuk newline,
  // tanda &, dan emoji) terkirim dengan benar.
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Pesan singkat untuk pertanyaan umum (tombol "Tanya Admin"). */
export function buildGeneralInquiryMessage(brandName: string): string {
  return `Halo ${brandName}, saya ingin bertanya mengenai produk dan pemesanan dimsum. Terima kasih!`;
}

export function buildProductInquiryMessage(brandName: string, productName: string, url?: string): string {
  const lines = [`Halo ${brandName}, saya tertarik dengan produk *${productName}*.`];
  lines.push('Apakah produk ini tersedia?');
  if (url) lines.push(`Produk: ${url}`);
  return lines.join('\n');
}
