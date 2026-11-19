import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Flame, MessageCircle } from 'lucide-react';
import { Hero } from '@/components/public/Hero';
import { TrustSection } from '@/components/public/TrustSection';
import { CategoryCard } from '@/components/public/CategoryCard';
import { ProductCard } from '@/components/public/ProductCard';
import { ArticleCard } from '@/components/public/ArticleCard';
import { TestimonialCard } from '@/components/public/TestimonialCard';
import { SectionHeading } from '@/components/ui/Misc';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppLink } from '@/components/public/WhatsAppLink';
import {
  getCategories,
  getFeaturedProducts,
  getPromoProducts,
  listPublishedArticles,
  getVisibleTestimonials,
} from '@/lib/database';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { buildGeneralInquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Halaman beranda: hero, keunggulan, kategori, favorit, promo, testimoni, artikel. */
export default async function HomePage() {
  const [settings, categories, featured, promos, testimonials, articles] = await Promise.all([
    getStoreSettings(),
    getCategories(),
    getFeaturedProducts(8),
    getPromoProducts(4),
    getVisibleTestimonials(6),
    listPublishedArticles({ limit: 3 }),
  ]);

  const whatsappUrl = hasWhatsAppNumber(settings)
    ? buildWhatsAppUrl(settings.whatsappNumber, buildGeneralInquiryMessage(settings.brandName))
    : null;
  const highlight = featured[0] ?? null;

  return (
    <>
      <Hero
        brandName={settings.brandName}
        description={settings.description}
        whatsappUrl={whatsappUrl}
        highlightProduct={highlight}
      />

      <TrustSection />

      <section className="bg-stone/40 py-12 md:py-16" aria-labelledby="judul-kategori">
        <div className="container-page space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Pilihan kategori"
              title="Temukan dimsum favorit Anda"
              description="Dari dimsum ayam klasik hingga paket keluarga hemat — semua siap dikukus di rumah."
              className="max-w-xl"
            />
            <ButtonLink href="/products" variant="outline" size="sm">
              Semua produk
              <ArrowRight aria-hidden className="h-4 w-4" />
            </ButtonLink>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page section" aria-labelledby="judul-favorit">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Favorit Pelanggan"
            title="Produk paling sering dipesan"
            description="Dipilih berdasarkan jumlah penjualan di toko kami."
          />
          {featured.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {featured.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={index < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-3xl border border-dashed border-sand bg-white p-6 text-sm text-charcoal/80">
              Belum ada produk unggulan. Tambahkan produk melalui dashboard admin.
            </p>
          )}
        </div>
      </section>

      {promos.length > 0 ? (
        <section className="bg-forest py-12 text-white md:py-16" aria-labelledby="judul-promo">
          <div className="container-page space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-harvest">
                  <Flame aria-hidden className="h-3.5 w-3.5" />
                  Sedang promo
                </p>
                <h2 id="judul-promo" className="font-display text-2xl text-white sm:text-3xl">
                  Harga spesial, rasa tetap juara
                </h2>
                <p className="text-white/85">
                  Nikmati potongan harga untuk pilihan dimsum dan paket hemat selama periode promo
                  berlangsung.
                </p>
              </div>
              <ButtonLink href="/promotions" variant="primary" size="sm">
                Lihat semua promo
              </ButtonLink>
            </div>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {promos.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="container-page section" aria-labelledby="judul-testimoni">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Kata pelanggan"
              title="Apa kata mereka tentang dimsum kami"
              description="Testimoni di bawah ini mencakup data contoh yang digunakan saat pengembangan."
              align="center"
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <li key={testimonial.id}>
                  <TestimonialCard testimonial={testimonial} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section className="bg-stone/40 py-12 md:py-16" aria-labelledby="judul-artikel">
          <div className="container-page space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Artikel & tips"
                title="Cara menikmati dimsum di rumah"
                description="Panduan mengukus, menyimpan, dan menyajikan dimsum agar hasilnya maksimal."
                className="max-w-xl"
              />
              <ButtonLink href="/articles" variant="outline" size="sm">
                Semua artikel
              </ButtonLink>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <li key={article.id}>
                  <ArticleCard article={article} priority={index === 0} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="container-page section">
        <div className="card-surface flex flex-col items-center gap-5 px-6 py-10 text-center">
          <h2 className="font-display text-2xl sm:text-3xl">Siap pesan dimsum hari ini?</h2>
          <p className="max-w-2xl text-charcoal/85">
            Pilih produk, isi keranjang, lalu kirim pesanan lewat WhatsApp. Admin akan mengonfirmasi
            ketersediaan, total akhir, dan jadwal pengambilan atau pengiriman.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/products" size="lg">
              Mulai pesan
            </ButtonLink>
            {whatsappUrl ? (
              <WhatsAppLink url={whatsappUrl} size="lg" variant="secondary">
                <MessageCircle aria-hidden className="h-4 w-4" />
                Tanya admin
              </WhatsAppLink>
            ) : (
              <Link
                href="/about"
                className="inline-flex min-h-[52px] items-center rounded-xl border border-forest/25 px-6 font-semibold text-forest"
              >
                Kenali kami lebih dekat
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
