import type { Metadata } from 'next';
import { CartView } from '@/components/public/CartView';
import { SectionHeading } from '@/components/ui/Misc';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Keranjang & Checkout',
  description:
    'Periksa produk pilihan Anda, lengkapi data pemesan, lalu kirim pesanan dimsum melalui WhatsApp.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

/** Halaman keranjang dan checkout (alur dua langkah dalam satu halaman). */
export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <div className="container-page section">
      <SectionHeading
        eyebrow="Keranjang belanja"
        title="Keranjang & Checkout"
        description="Harga dan stok diverifikasi ulang oleh server sebelum pesanan dibuat, sehingga informasi yang Anda lihat selalu akurat."
        as="h1"
        className="mb-8"
      />
      <CartView
        brandName={settings.brandName}
        shippingCost={settings.shippingCost}
        freeShippingMin={settings.freeShippingMin}
        storeAddress={settings.address}
        operatingHours={settings.operatingHours}
        whatsappConfigured={hasWhatsAppNumber(settings)}
      />
    </div>
  );
}
