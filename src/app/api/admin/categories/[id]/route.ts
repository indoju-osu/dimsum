import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { categoryInputSchema } from '@/lib/validation';
import { ensureUniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/categories/[id] — perbarui kategori. */
export async function PUT(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

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
    if (nameClash && nameClash.id !== id) {
      return Response.json({ error: 'Nama kategori sudah dipakai.' }, { status: 409 });
    }

    const desiredSlug = input.slug || input.name;
    const slug =
      desiredSlug === existing.slug
        ? existing.slug
        : await ensureUniqueSlug(
            desiredSlug,
            async (candidate) => {
              const found = await prisma.category.findUnique({ where: { slug: candidate } });
              return Boolean(found && found.id !== id);
            },
            'kategori',
          );

    const category = await prisma.category.update({
      where: { id },
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
      action: 'UPDATE',
      entity: 'Category',
      entityId: id,
      description: `Memperbarui kategori "${category.name}".`,
    });

    return Response.json({ ok: true, category: { id: category.id, slug: category.slug } });
  } catch (error) {
    return errorResponse(error, 'Gagal memperbarui kategori.');
  }
}

/**
 * DELETE /api/admin/categories/[id] — hapus kategori.
 * Kategori yang masih dipakai produk tidak boleh dihapus (relasi Restrict);
 * sistem menyarankan menonaktifkannya.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return Response.json(
        {
          error: `Kategori masih dipakai oleh ${productCount} produk. Pindahkan produk tersebut atau nonaktifkan kategori ini.`,
        },
        { status: 409 },
      );
    }

    const category = await prisma.category.delete({ where: { id } });
    await logActivity({
      actor: session.username,
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
      description: `Menghapus kategori "${category.name}".`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'Gagal menghapus kategori.');
  }
}
