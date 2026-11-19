import Link from 'next/link';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { getCategories } from '@/lib/database';
import { PUBLIC_NAV } from '@/lib/constants';
import { buildGeneralInquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { CartBadge } from './CartBadge';
import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';
import { WhatsAppLink } from './WhatsAppLink';

/**
 * Header sticky dengan navigasi desktop, menu hamburger (mobile), dan badge
 * keranjang. Data brand, kategori, serta nomor WhatsApp selalu diambil dari
 * pengaturan toko (tidak pernah dikarang).
 */
export async function Header() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategories()]);
  const whatsappUrl = hasWhatsAppNumber(settings)
    ? buildWhatsAppUrl(settings.whatsappNumber, buildGeneralInquiryMessage(settings.brandName))
    : null;
  const navItems = PUBLIC_NAV.map((item) => ({ href: item.href, label: item.label }));

  return (
    <header className="sticky top-0 z-50 border-b border-stone/80 bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
      <div className="container-page flex min-h-[68px] items-center gap-4 py-2">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${settings.brandName} - Beranda`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-lg font-bold text-harvest">
            {settings.brandName.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-lg font-semibold text-forest">
              {settings.brandName}
            </span>
            <span className="text-xs text-charcoal/70">Dimsum hangat &amp; premium</span>
          </span>
        </Link>

        <DesktopNav items={navItems} />

        <div className="ml-auto flex items-center gap-2">
          {whatsappUrl ? (
            <WhatsAppLink
              url={whatsappUrl}
              size="sm"
              className="hidden md:inline-flex"
              ariaLabel="Pesan sekarang melalui WhatsApp"
            >
              Pesan Sekarang
            </WhatsAppLink>
          ) : null}
          <CartBadge />
          <MobileNav items={navItems} categories={categories} whatsappUrl={whatsappUrl} />
        </div>
      </div>
    </header>
  );
}

export default Header;
