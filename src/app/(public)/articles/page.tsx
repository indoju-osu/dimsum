import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '@/components/public/ArticleCard';
import { SectionHeading, EmptyState } from '@/components/ui/Misc';
import { listPublishedArticles } from '@/lib/database';

export const metadata: Metadata = {
  title: 'Artikel & Tips Dimsum',
  description:
    'Panduan mengukus, menyimpan, dan menyajikan dimsum, plus ide camilan keluarga dari dapur kami.',
  alternates: { canonical: '/articles' },
};

/** Daftar artikel yang sudah dipublikasikan. */
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const [articles, allArticles] = await Promise.all([
    listPublishedArticles({ category: kategori, limit: 30 }),
    listPublishedArticles({ limit: 50 }),
  ]);
  const categories = Array.from(new Set(allArticles.map((article) => article.category)));

  return (
    <div className="container-page section space-y-8">
      <SectionHeading
        eyebrow="Artikel & tips"
        title="Artikel & Tips Dimsum"
        description="Kumpulan panduan praktis seputar dimsum: cara mengukus yang tepat, menyimpan stok frozen, hingga ide sajian untuk keluarga."
        as="h1"
      />

      {categories.length > 1 ? (
        <nav aria-label="Filter kategori artikel" className="flex flex-wrap gap-2">
          <Link
            href="/articles"
            className={
              !kategori
                ? 'inline-flex min-h-[44px] items-center rounded-xl bg-forest px-4 text-sm font-medium text-white'
                : 'inline-flex min-h-[44px] items-center rounded-xl border border-stone bg-white px-4 text-sm font-medium text-forest hover:border-olive'
            }
          >
            Semua
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/articles?kategori=${encodeURIComponent(category)}`}
              className={
                kategori === category
                  ? 'inline-flex min-h-[44px] items-center rounded-xl bg-forest px-4 text-sm font-medium text-white'
                  : 'inline-flex min-h-[44px] items-center rounded-xl border border-stone bg-white px-4 text-sm font-medium text-forest hover:border-olive'
              }
            >
              {category}
            </Link>
          ))}
        </nav>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState
          title="Belum ada artikel"
          description="Artikel akan tampil di sini setelah dipublikasikan melalui dashboard admin."
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <li key={article.id}>
              <ArticleCard article={article} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
