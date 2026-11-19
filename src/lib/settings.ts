/**
 * Pengaturan toko (tabel StoreSettings, satu baris dengan id "singleton").
 *
 * NILAI DEFAULT SENGAJA KOSONG untuk data bisnis yang tidak boleh dikarang
 * (nomor WhatsApp, alamat, akun media sosial). Bila belum diisi, aplikasi
 * menampilkan peringatan kepada admin alih-alih mencetak informasi palsu.
 */
import { SITE_NAME_FALLBACK } from './constants';
import { prisma } from './prisma';

export type StoreSettingsView = {
  id: string;
  brandName: string;
  logo: string | null;
  favicon: string | null;
  description: string;
  whatsappNumber: string;
  address: string | null;
  operatingHours: string | null;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  shippingInfo: string | null;
  paymentInfo: string | null;
  shippingCost: number;
  freeShippingMin: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  updatedAt: Date | null;
};

export const defaultSettings: StoreSettingsView = {
  id: 'singleton',
  brandName: process.env.STORE_BRAND_NAME?.trim() || SITE_NAME_FALLBACK,
  logo: '/images/logo.svg',
  favicon: '/icon.png',
  description:
    'Menghadirkan aneka dimsum lezat dengan bahan pilihan, cita rasa autentik, dan kualitas yang terjaga.',
  whatsappNumber: process.env.STORE_WHATSAPP?.replace(/\D/g, '') ?? '',
  address: null,
  operatingHours: null,
  instagram: null,
  tiktok: null,
  email: null,
  shippingInfo: null,
  paymentInfo: null,
  shippingCost: 0,
  freeShippingMin: null,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  updatedAt: null,
};

/**
 * Ambil pengaturan toko. Bila baris belum ada atau database belum siap,
 * kembalikan default supaya halaman publik tidak error.
 */
export async function getStoreSettings(): Promise<StoreSettingsView> {
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) return defaultSettings;
    return {
      id: settings.id,
      brandName: settings.brandName || defaultSettings.brandName,
      logo: settings.logo,
      favicon: settings.favicon,
      description: settings.description || defaultSettings.description,
      whatsappNumber: settings.whatsappNumber.replace(/\D/g, ''),
      address: settings.address,
      operatingHours: settings.operatingHours,
      instagram: settings.instagram,
      tiktok: settings.tiktok,
      email: settings.email,
      shippingInfo: settings.shippingInfo,
      paymentInfo: settings.paymentInfo,
      shippingCost: settings.shippingCost,
      freeShippingMin: settings.freeShippingMin,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      seoKeywords: settings.seoKeywords,
      updatedAt: settings.updatedAt,
    };
  } catch (error) {
    console.error('[settings] Gagal membaca pengaturan toko:', error);
    return defaultSettings;
  }
}

/** Apakah nomor WhatsApp sudah diisi pemilik usaha. */
export function hasWhatsAppNumber(settings: StoreSettingsView): boolean {
  return settings.whatsappNumber.length >= 9;
}

/**
 * Kunci konfigurasi yang belum lengkap — dipakai untuk menampilkan peringatan
 * pada dashboard admin (bukan pada halaman pelanggan).
 */
export function missingConfigKeys(settings: StoreSettingsView): string[] {
  const missing: string[] = [];
  if (!hasWhatsAppNumber(settings)) missing.push('Nomor WhatsApp');
  if (!settings.address) missing.push('Alamat toko');
  if (!settings.operatingHours) missing.push('Jam operasional');
  if (!settings.shippingInfo) missing.push('Informasi pengiriman');
  if (!settings.paymentInfo) missing.push('Informasi pembayaran');
  if (!settings.seoTitle || !settings.seoDescription) missing.push('SEO (judul & deskripsi)');
  return missing;
}
