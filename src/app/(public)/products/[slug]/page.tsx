import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { ProductGallery } from '@/components/public/ProductGallery';
import { ProductPurchasePanel } from '@/components/public/ProductPurchasePanel';
import { ProductCard } from '@/components/public/ProductCard';
import { SectionHeading } from '@/components/ui/Misc';
import { JsonLd } from '@/components/shared/JsonLd';
import { getProductBySlug, getRelatedProducts } from '@/lib/database';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { buildProductInquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatRupiah } from '@/lib/format';

type PageProps = { params: Promise<{ slug: string }> };

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: 'Produk tidak ditemukan' };
  }
  const origin = siteOrigin();
  const image = product.image.startsWith('http')
    ? product.image
    : `${origin}${product.image}`;
  return {
    title: product.name,
    description:
      product.shortDescription ??
      `${product.name} — ${product.contentLabel}. Pesan dimsum ${product.name} dengan harga ${formatRupiah(product.finalPrice)}.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.contentLabel,
      images: [{ url: image, alt: product.name }],
      type: 'website',
    },
  };
}

/** Halaman detail produk: galeri, pembelian, deskripsi, dan produk terkait. */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isPublished) notFound();

  const [settings, related] = await Promise.all([
    getStoreSettings(),
    getRelatedProducts(product.id, product.category.id, 4),
  ]);

  const origin = siteOrigin();
  const productUrl = `${origin}/products/${product.slug}`;
  const whatsappUrl = hasWhatsAppNumber(settings)
    ? buildWhatsAppUrl(
        settings.whatsappNumber,
        buildProductInquiryMessage(settings.brandName, product.name, productUrl),
      )
    : null;

  const galleryImages =
    product.gallery.length > 0
      ? product.gallery
      : [{ id: 'main', url: product.image, alt: product.name }];

  const availability = product.isSoldOut
    ? 'https://schema.org/OutOfStock'
    : product.stock <= 0
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock';

  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: galleryImages.map((image) =>
      image.url.startsWith('http') ? image.url : `${origin}${image.url}`,
    ),
    sku: product.id,
    brand: { '@type': 'Brand', name: settings.brandName },
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      price: product.finalPrice,
      priceCurrency: 'IDR',
      availability,
      seller: { '@type': 'Organization', name: settings.brandName },
    },
    ...(product.variants.length > 0
      ? {
          hasVariant: product.variants.map((variant) => ({
            '@type': 'Product',
            name: variant.name,
            offers: {
              '@type': 'Offer',
              price: variant.finalPrice,
              priceCurrency: 'IDR',
              availability,
            },
          })),
        }
      : {}),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Produk', item: `${origin}/products` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category.name,
        item: `${origin}/products?category=${product.category.slug}`,
      },
      { '@type': 'ListItem', position: 4, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-product" data={productLd} />
      <JsonLd id="ld-breadcrumb" data={breadcrumbLd} />

      <nav aria-label="Breadcrumb" className="border-b border-stone bg-white">
        <ol className="container-page flex flex-wrap items-center gap-1 py-3 text-xs text-charcoal/75">
          <li>
            <Link href="/" className="link-underline">
              Beranda
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link href="/products" className="link-underline">
              Produk
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="link-underline"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-forest">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="container-page section space-y-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={galleryImages} alt={product.name} priority />
          <div>
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl">{product.name}</h1>
            {product.shortDescription ? (
              <p className="mt-3 text-base text-charcoal/85">{product.shortDescription}</p>
            ) : null}
            <div className="mt-6">
              <ProductPurchasePanel
                product={product}
                whatsappUrl={whatsappUrl}
                storeAddress={settings.address}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <article className="space-y-6">
            <h2 className="font-display text-2xl">Deskripsi produk</h2>
            <div className="space-y-4 text-base leading-relaxed text-charcoal/85">
              {product.description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBox title="Saran penyajian" value={product.servingSuggestion} />
              <InfoBox title="Saran penyimpanan" value={product.storageSuggestion} />
            </div>

            {product.ingredients ? (
              <section className="space-y-2">
                <h3 className="font-display text-xl">Komposisi</h3>
                <p className="text-charcoal/85">{product.ingredients}</p>
              </section>
            ) : (
              <p className="rounded-2xl border border-dashed border-sand bg-stone/50 p-4 text-sm text-charcoal/80">
                Rincian komposisi dan informasi alergen belum dicantumkan pemilik toko. Silakan
                tanyakan langsung melalui WhatsApp sebelum memesan bila Anda memiliki alergi
                tertentu.
              </p>
            )}
          </article>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-stone bg-white p-5 shadow-soft">
              <h2 className="font-display text-lg text-forest">Ringkasan</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/75">Isi</dt>
                  <dd className="font-medium text-forest">{product.contentLabel}</dd>
                </div>
                {product.weightGram ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-charcoal/75">Berat</dt>
                    <dd className="font-medium text-forest">{product.weightGram} gram</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/75">Status stok</dt>
                  <dd className="font-medium text-forest">
                    {product.isSoldOut ? 'Habis' : `${product.stock} tersedia`}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/75">Terjual</dt>
                  <dd className="font-medium text-forest">{product.soldCount} porsi</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/75">Kategori</dt>
                  <dd className="font-medium text-forest">
                    <Link href={`/products?category=${product.category.slug}`} className="link-underline">
                      {product.category.name}
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-stone bg-stone/50 p-5 text-sm text-charcoal/85">
              <h2 className="font-display text-lg text-forest">Informasi pengiriman</h2>
              <ul className="mt-3 space-y-2">
                <li>Ongkos kirim dikonfirmasi admin sesuai jarak dan alamat Anda.</li>
                {(settings.freeShippingMin ?? 0) > 0 ? (
                  <li>
                    Gratis ongkir untuk pembelian minimal{' '}
                    {formatRupiah(settings.freeShippingMin ?? 0)}.
                  </li>
                ) : null}
                <li>Pesanan diproses setelah admin mengonfirmasi ketersediaan barang.</li>
              </ul>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="space-y-6" aria-labelledby="judul-terkait">
            <SectionHeading eyebrow="Lainnya" title="Produk terkait" />
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

function InfoBox({ title, value }: { title: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-3xl border border-stone bg-white p-5 shadow-soft">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-olive">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/85">{value}</p>
    </div>
  );
}
