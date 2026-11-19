import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { listAdminArticles } from '@/lib/admin-data';
import { articleInputSchema } from '@/lib/validation';
import { ensureUniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';

/** GET /api/admin/articles — seluruh artikel (termasuk draft). */
export async function GET() {
  try {
    await requireAdmin();
    const items = await listAdminArticles();
    return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat artikel.');
  }
}

/** POST /api/admin/articles — tambah artikel. */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();

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
    const slug = await ensureUniqueSlug(
      input.slug || input.title,
      async (candidate) => Boolean(await prisma.article.findUnique({ where: { slug: candidate } })),
      'artikel',
    );

    const article = await prisma.article.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage,
        category: input.category,
        status: input.status,
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    await logActivity({
      actor: session.username,
      action: 'CREATE',
      entity: 'Article',
      entityId: article.id,
      description: `Menambahkan artikel "${article.title}" (${input.status === 'PUBLISHED' ? 'terbit' : 'draft'}).`,
    });

    return Response.json({ ok: true, article: { id: article.id, slug: article.slug } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Gagal menyimpan artikel.');
  }
}
