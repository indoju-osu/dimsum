import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { CartProvider } from '@/components/public/CartProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { getStoreSettings } from '@/lib/settings';

/**
 * Tipografi brand:
 * - Playfair Display untuk heading (kesan artisan & premium).
 * - Plus Jakarta Sans untuk body (keterbacaan tinggi di layar kecil).
 *
 * Berkas font disimpan di src/app/fonts/ (variable font Latin 400-700, lisensi
 * OFL) dan dimuat dengan next/font/local. Dengan cara ini build tidak lagi
 * memanggil fonts.googleapis.com, sehingga terhindar dari kegagalan acak
 * `next/font/google` saat Google membalas URL font tanpa ekstensi
 * (vercel/next.js#99114). Font tetap di-host sendiri dan bebas layout shift.
 */
const playfair = localFont({
  src: './fonts/playfair-display-latin.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--font-playfair',
});

const jakarta = localFont({
  src: './fonts/plus-jakarta-sans-latin.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--font-jakarta',
});

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const url = siteUrl();
  const title = settings.seoTitle || `${settings.brandName} - Dimsum Lezat, Hangat, dan Bikin Ketagihan`;
  const description =
    settings.seoDescription ||
    `${settings.brandName} menyediakan aneka dimsum ayam, udang, premium, mentai, dan paket keluarga. Pesan mudah melalui WhatsApp.`;
  const keywords = settings.seoKeywords?.split(',').map((keyword) => keyword.trim()) ?? [];

  return {
    metadataBase: new URL(url),
    title: {
      default: title,
      template: `%s | ${settings.brandName}`,
    },
    description,
    keywords,
    applicationName: settings.brandName,
    authors: [{ name: settings.brandName }],
    creator: settings.brandName,
    publisher: settings.brandName,
    alternates: { canonical: '/' },
    icons: {
      icon: [
        { url: '/images/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/images/icon.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/images/apple-icon.png', sizes: '180x180' }],
      shortcut: ['/images/favicon.ico.png'],
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url,
      siteName: settings.brandName,
      title,
      description,
      images: [
        {
          url: '/images/og-default.png',
          width: 1200,
          height: 630,
          alt: `${settings.brandName} - aneka dimsum pilihan`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/og-default.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#26351F',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="min-h-screen bg-ivory">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-forest focus:px-4 focus:py-2 focus:text-white"
        >
          Lewati ke konten utama
        </a>
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
