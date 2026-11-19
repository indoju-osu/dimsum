import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, ChevronRight, Tag } from 'lucide-react';
import { ArticleBody } from '@/components/public/ArticleBody';
import { ArticleCard } from '@/components/public/ArticleCard';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { SectionHeading } from '@/components/ui/Misc';
import { JsonLd } from '@/components/shared/JsonLd';
import { getPublishedArticleBySlug, getRelatedArticles } from '@/lib/database';
import { getStoreSettings } from '@/lib/settings';
import { formatDate } from '@/lib/format';

type PageProps = { params: Promise<{ slug: string }> };

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: 'Artikel tidak ditemukan' };
  const origin = siteOrigin();
  const image = article.coverImage?.startsWith('http')
    ? article.coverImage
    : article.coverImage
      ? `${origin}${article.coverImage}`
      : undefined;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(image ? { images: [{ url: image, alt: article.title }] } : {}),
    },
  };
}

/** Halaman detail artikel dengan structured data Article dan artikel terkait. */
export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const [settings, related] = await Promise.all([
    getStoreSettings(),
    getRelatedArticles(article.slug, 3),
  ]);

  const origin = siteOrigin();
  const url = `${origin}/articles/${article.slug}`;
  const cover = article.coverImage?.startsWith('http')
    ? article.coverImage
    : article.coverImage
      ? `${origin}${article.coverImage}`
      : undefined;

  const articleLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    articleSection: article.category,
    ...(cover ? { image: [cover] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: settings.brandName },
    publisher: { '@type': 'Organization', name: settings.brandName },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Artikel', item: `${origin}/articles` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd id="ld-article" data={articleLd} />
      <JsonLd id="ld-breadcrumb-article" data={breadcrumbLd} />

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
            <Link href="/articles" className="link-underline">
              Artikel
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-forest">
            {article.title}
          </li>
        </ol>
      </nav>

      <article className="container-page section max-w-3xl">
        <header className="space-y-4">
          <p className="eyebrow">
            <Tag aria-hidden className="h-3.5 w-3.5" />
            {article.category}
          </p>
          <h1 className="text-3xl leading-tight sm:text-4xl">{article.title}</h1>
          <p className="flex items-center gap-2 text-sm text-charcoal/75">
            <CalendarDays aria-hidden className="h-4 w-4" />
            {article.publishedAt ? formatDate(article.publishedAt) : 'Belum diterbitkan'}
          </p>
          <p className="text-lg leading-relaxed text-charcoal/85">{article.excerpt}</p>
        </header>

        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-stone bg-stone/40">
          <ImageWithFallback
            src={article.coverImage}
            alt={`Foto ilustrasi artikel ${article.title}`}
            priority
            sizes="(max-width: 1024px) 100vw, 768px"
          />
        </div>

        <div className="article-body mt-10">
          <ArticleBody content={article.content} />
        </div>

        <footer className="mt-10 rounded-3xl border border-stone bg-stone/50 p-5 text-sm text-charcoal/85">
          <p>
            Butuh dimsum siap kukus untuk menemani waktu santai? Lihat{' '}
            <Link href="/products" className="link-underline font-medium text-forest">
              katalog produk kami
            </Link>{' '}
            atau cek{' '}
            <Link href="/promotions" className="link-underline font-medium text-forest">
              promo yang sedang berjalan
            </Link>
            .
          </p>
        </footer>
      </article>

      {related.length > 0 ? (
        <section className="container-page space-y-6 pb-16" aria-labelledby="judul-artikel-terkait">
          <SectionHeading eyebrow="Baca juga" title="Artikel lainnya" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ArticleCard article={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
