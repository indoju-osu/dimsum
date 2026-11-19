import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { getCategories } from '@/lib/database';
import { categoryInputSchema } from '@/lib/validation';
import { ensureUniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';

/** GET /api/admin/categories — daftar kategori (termasuk yang nonaktif). */
export async function GET() {
  try {
    await requireAdmin();
    const categories = await getCategories({ includeInactive: true });
    return Response.json({ items: categories }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat kategori.');
  }
}

/** POST /api/admin/categories — tambah kategori. */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = categoryInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data kategori tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const nameClash = await prisma.category.findUnique({ where: { name: input.name } });
    if (nameClash) {
      return Response.json({ error: 'Nama kategori sudah dipakai.' }, { status: 409 });
    }

    const slug = await ensureUniqueSlug(
      input.slug || input.name,
      async (candidate) => Boolean(await prisma.category.findUnique({ where: { slug: candidate } })),
      'kategori',
    );

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        image: input.image,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
    });

    await logActivity({
      actor: session.username,
      action: 'CREATE',
      entity: 'Category',
      entityId: category.id,
      description: `Menambahkan kategori "${category.name}".`,
    });

    return Response.json({ ok: true, category: { id: category.id, slug: category.slug } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Gagal menyimpan kategori.');
  }
}
