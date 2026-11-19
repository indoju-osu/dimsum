import Link from 'next/link';
import { Clock, Instagram, Mail, MapPin, Music2 } from 'lucide-react';
import { getCategories } from '@/lib/database';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { PUBLIC_NAV } from '@/lib/constants';
import { buildGeneralInquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { WhatsAppLink } from './WhatsAppLink';

/**
 * Footer dinamis: tautan navigasi, kategori dari database, dan informasi kontak
 * yang HANYA tampil bila sudah diisi pemilik toko melalui dashboard admin.
 */
export async function Footer() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  const whatsappUrl = hasWhatsAppNumber(settings)
    ? buildWhatsAppUrl(settings.whatsappNumber, buildGeneralInquiryMessage(settings.brandName))
    : null;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-stone bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-lg font-bold text-harvest">
              {settings.brandName.slice(0, 1).toUpperCase()}
            </span>
            <span className="font-display text-lg font-semibold text-forest">
              {settings.brandName}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-charcoal/80">{settings.description}</p>
          <WhatsAppLink url={whatsappUrl} size="sm">
            Pesan via WhatsApp
          </WhatsAppLink>
        </div>

        <nav aria-label="Tautan footer" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-olive">Navigasi</h2>
          <ul className="space-y-2 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline text-charcoal/85">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cart" className="link-underline text-charcoal/85">
                Keranjang
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Kategori produk" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-olive">Kategori</h2>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 8).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="link-underline text-charcoal/85"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-olive">
            Kontak &amp; Jam Buka
          </h2>
          <ul className="space-y-3 text-sm text-charcoal/85">
            {settings.address ? (
              <li className="flex gap-2">
                <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <span>{settings.address}</span>
              </li>
            ) : null}
            {settings.operatingHours ? (
              <li className="flex gap-2">
                <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <span>{settings.operatingHours}</span>
              </li>
            ) : null}
            {settings.email ? (
              <li className="flex gap-2">
                <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <a href={`mailto:${settings.email}`} className="link-underline">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.instagram ? (
              <li className="flex gap-2">
                <Instagram aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  Instagram
                </a>
              </li>
            ) : null}
            {settings.tiktok ? (
              <li className="flex gap-2">
                <Music2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <a
                  href={settings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  TikTok
                </a>
              </li>
            ) : null}
            {!settings.address && !settings.operatingHours && !settings.email ? (
              <li className="rounded-2xl border border-dashed border-sand bg-stone/50 p-3 text-xs text-charcoal/80">
                Informasi alamat, jam buka, dan kontak belum diisi. Silakan lengkapi melalui
                dashboard admin agar tampil di sini.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-stone">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-charcoal/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.brandName}. Seluruh hak cipta dilindungi.
          </p>
          <p>
            Foto produk pada situs ini adalah foto ilustrasi berlisensi. Ganti dengan foto asli
            sebelum digunakan untuk promosi resmi.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
