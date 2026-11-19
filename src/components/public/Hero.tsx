import Link from 'next/link';
import { Clock3, PackageCheck, Sparkles, Star } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { WhatsAppLink } from './WhatsAppLink';
import { formatRupiah } from '@/lib/format';

/**
 * Hero dua kolom: teks persuasif di kiri, gambar 4:3 + kartu harga di kanan.
 */
export function Hero({
  brandName,
  description,
  whatsappUrl,
  highlightProduct,
}: {
  brandName: string;
  description: string;
  whatsappUrl: string | null;
  highlightProduct?: {
    name: string;
    slug: string;
    image: string;
    finalPrice: number;
    contentLabel: string;
  } | null;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone/70 via-ivory to-ivory">
      <div className="container-page grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
        <div className="space-y-6">
          <p className="eyebrow">
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            Dimsum artisanal, dibuat harian
          </p>
          <h1 className="text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Dimsum hangat &amp; premium untuk keluarga Indonesia
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-charcoal/85">{description}</p>

          <ul className="grid gap-2 text-sm text-charcoal/85 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <PackageCheck aria-hidden className="h-4 w-4 text-olive" />
              Tersedia paket hemat &amp; keluarga
            </li>
            <li className="flex items-center gap-2">
              <Clock3 aria-hidden className="h-4 w-4 text-olive" />
              Siap dikukus kapan saja
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/products" size="lg">
              Lihat Semua Produk
            </ButtonLink>
            <WhatsAppLink url={whatsappUrl} size="lg" variant="secondary">
              Tanya via WhatsApp
            </WhatsAppLink>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-charcoal/75">
            <span className="inline-flex items-center gap-1.5">
              <Star aria-hidden className="h-4 w-4 fill-harvest text-harvest" />
              Resep rumahan, bahan pilihan
            </span>
            <span>Pesan praktis lewat WhatsApp</span>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-stone bg-white shadow-card">
            <ImageWithFallback
              src="/images/hero/hero-utama.webp"
              alt={`Foto ilustrasi dimsum ${brandName}`}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {highlightProduct ? (
            <div className="mt-4 rounded-3xl border border-stone bg-white p-4 shadow-soft sm:absolute sm:-bottom-8 sm:right-6 sm:mt-0 sm:max-w-[280px]">
              <p className="text-xs font-semibold uppercase tracking-wide text-olive">
                Favorit pelanggan
              </p>
              <p className="mt-1 font-display text-lg leading-snug text-forest">
                {highlightProduct.name}
              </p>
              <p className="text-xs text-charcoal/70">{highlightProduct.contentLabel}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold text-forest">
                  {formatRupiah(highlightProduct.finalPrice)}
                </span>
                <Link
                  href={`/products/${highlightProduct.slug}`}
                  className="text-sm font-semibold text-forest underline decoration-harvest decoration-2 underline-offset-4"
                >
                  Lihat
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Hero;
