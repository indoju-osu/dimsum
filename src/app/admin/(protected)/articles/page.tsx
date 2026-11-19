import Link from 'next/link';
import { AdminCard, AdminPageHeader, TableWrap, Td, Th } from '@/components/admin/AdminUI';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { listAdminArticles } from '@/lib/admin-data';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Artikel' };

/** Daftar artikel beserta status publikasinya. */
export default async function AdminArticlesPage() {
  const articles = await listAdminArticles();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Artikel"
        description={`${articles.length} artikel. Artikel berstatus draft tidak tampil di situs publik.`}
        actions={<ButtonLink href="/admin/articles/new">Tambah artikel</ButtonLink>}
      />

      <AdminCard title="Semua artikel">
        {articles.length === 0 ? (
          <EmptyState title="Belum ada artikel" description="Mulai dengan menulis panduan atau tips seputar dimsum." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Judul</Th>
                <Th>Kategori</Th>
                <Th>Status</Th>
                <Th>Terbit</Th>
                <Th>Diperbarui</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <Td>
                    <span className="font-medium text-forest">{article.title}</span>
                    <span className="block max-w-md truncate text-xs text-charcoal/65">
                      /articles/{article.slug}
                    </span>
                  </Td>
                  <Td>{article.category}</Td>
                  <Td>
                    <Badge tone={article.status === 'PUBLISHED' ? 'olive' : 'neutral'}>
                      {article.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-charcoal/75">
                    {article.publishedAt ? formatDate(article.publishedAt) : '—'}
                  </Td>
                  <Td className="text-xs text-charcoal/75">{formatDate(article.updatedAt)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[36px] items-center rounded-lg px-2.5 text-xs font-medium text-charcoal transition-colors hover:bg-stone/60"
                      >
                        Lihat
                      </Link>
                      <ButtonLink href={`/admin/articles/${article.id}`} variant="outline" size="sm">
                        Ubah
                      </ButtonLink>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </AdminCard>
    </div>
  );
}
