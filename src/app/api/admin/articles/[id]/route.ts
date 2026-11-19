import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { articleInputSchema } from '@/lib/validation';
import { ensureUniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/articles/[id] — perbarui artikel. */
export async function PUT(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = articleInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data artikel tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const desiredSlug = input.slug || input.title;
    const slug =
      desiredSlug === existing.slug
        ? existing.slug
        : await ensureUniqueSlug(
            desiredSlug,
            async (candidate) => {
              const found = await prisma.article.findUnique({ where: { slug: candidate } });
              return Boolean(found && found.id !== id);
            },
            'artikel',
          );

    // Tanggal terbit diisi saat artikel pertama kali dipublikasikan.
    const publishedAt =
      input.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null;

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage,
        category: input.category,
        status: input.status,
        publishedAt,
      },
    });

    await logActivity({
      actor: session.username,
      action: 'UPDATE',
      entity: 'Article',
      entityId: id,
      description: `Memperbarui artikel "${article.title}" (${input.status === 'PUBLISHED' ? 'terbit' : 'draft'}).`,
    });

    return Response.json({ ok: true, article: { id: article.id, slug: article.slug } });
  } catch (error) {
    return errorResponse(error, 'Gagal memperbarui artikel.');
  }
}

/** DELETE /api/admin/articles/[id] — hapus artikel. */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const article = await prisma.article.delete({ where: { id } });
    await logActivity({
      actor: session.username,
      action: 'DELETE',
      entity: 'Article',
      entityId: id,
      description: `Menghapus artikel "${article.title}".`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'Gagal menghapus artikel.');
  }
}
