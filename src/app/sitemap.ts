import type { MetadataRoute } from 'next';
import { getProductSlugs, getArticleSlugs, getCategories } from '@/lib/database';

/**
 * Sitemap dinamis: halaman statis publik + produk, kategori, dan artikel yang
 * sudah dipublikasikan. Bila database belum siap, hanya halaman statis yang
 * dimasukkan agar build tidak gagal.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/promotions`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  try {
    const [products, articles, categories] = await Promise.all([
      getProductSlugs(),
      getArticleSlugs(),
      getCategories(),
    ]);

    return [
      ...staticEntries,
      ...products.map((product) => ({
        url: `${base}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...categories.map((category) => ({
        url: `${base}/products?category=${category.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...articles.map((article) => ({
        url: `${base}/articles/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
    ];
  } catch (error) {
    console.error('[sitemap] Gagal membaca data dari database:', error);
    return staticEntries;
  }
}
