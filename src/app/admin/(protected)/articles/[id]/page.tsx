import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminUI';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Ubah Artikel' };

type Params = Promise<{ id: string }>;

/** Halaman ubah artikel. */
export default async function EditArticlePage({ params }: { params: Params }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Artikel"
        title="Ubah artikel"
        description={`Status saat ini: ${article.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}.`}
      />
      <ArticleForm
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          category: article.category,
          status: article.status,
          publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
          updatedAt: article.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
