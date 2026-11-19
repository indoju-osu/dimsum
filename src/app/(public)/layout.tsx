import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { JsonLd } from '@/components/shared/JsonLd';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { buildGeneralInquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

/**
 * Layout halaman publik: header sticky, konten, footer dinamis, serta
 * structured data Organization/LocalBusiness.
 *
 * Semua halaman publik dirender saat request (force-dynamic) karena harga,
 * stok, dan pengaturan toko berubah dari dashboard admin dan harus selalu
 * tampil terbaru tanpa menunggu rebuild.
 */
export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  const whatsappUrl = hasWhatsAppNumber(settings)
    ? buildWhatsAppUrl(settings.whatsappNumber, buildGeneralInquiryMessage(settings.brandName))
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';

  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: settings.brandName,
    description: settings.description,
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(settings.logo ? { logo: `${siteUrl}${settings.logo}` } : {}),
    ...(settings.address
      ? { address: { '@type': 'PostalAddress', streetAddress: settings.address } }
      : {}),
    ...(settings.operatingHours ? { openingHours: settings.operatingHours } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(whatsappUrl ? { contactPoint: { '@type': 'ContactPoint', url: whatsappUrl } } : {}),
    servesCuisine: 'Dimsum / Chinese Indonesian',
  };

  return (
    <>
      <JsonLd id="ld-organization" data={organization} />
      <Header />
      <main id="konten">{children}</main>
      <Footer />
    </>
  );
}
