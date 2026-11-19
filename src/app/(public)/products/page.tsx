import type { Metadata } from 'next';
import { ProductsExplorer } from '@/components/public/ProductsExplorer';
import { SectionHeading } from '@/components/ui/Misc';
import { getCategories, getCatalogPriceRange } from '@/lib/database';
import { filtersFromSearchParams, defaultCatalogFilters } from '@/lib/catalog-filters';

export const metadata: Metadata = {
  title: 'Semua Produk Dimsum',
  description:
    'Jelajahi semua produk dimsum: ayam, udang, premium, mentai, frozen, paket hemat, hingga paket keluarga. Filter sesuai kebutuhan Anda.',
  alternates: { canonical: '/products' },
};

/**
 * Halaman katalog. Filter awal dibaca dari query string di server agar tautan
 * (mis. /products?category=dimsum-ayam) dapat langsung dibagikan.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flat = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') flat.set(key, value);
    else if (Array.isArray(value) && value[0]) flat.set(key, value[0]);
  }

  const [categories, priceRange] = await Promise.all([getCategories(), getCatalogPriceRange()]);
  const initialFilters = filtersFromSearchParams(flat) ?? defaultCatalogFilters;

  return (
    <div className="container-page section">
      <SectionHeading
        eyebrow="Katalog dimsum"
        title="Semua produk kami"
        description="Gunakan pencarian dan filter untuk menemukan dimsum yang paling sesuai. Harga dan stok ditampilkan secara real-time dari data toko."
        as="h1"
        className="mb-8"
      />
      <ProductsExplorer
        categories={categories}
        initialFilters={initialFilters}
        priceRange={priceRange}
      />
    </div>
  );
}
