import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { productInputSchema, stockUpdateSchema } from '@/lib/validation';
import { ensureUniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';
import { productInclude, toProductDetail } from '@/lib/database';

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/products/[id] — detail produk untuk form edit. */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) {
      return Response.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    return Response.json(
      { product: toProductDetail(product) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error, 'Gagal memuat produk.');
  }
}

/**
 * PUT /api/admin/products/[id] — perbarui produk.
 * Galeri dan varian diganti seluruhnya (delete + create) agar urutannya sesuai
 * form; relasi memakai onDelete: Cascade.
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data produk tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      return Response.json({ error: 'Kategori tidak ditemukan.' }, { status: 400 });
    }

    const desiredSlug = input.slug || input.name;
    const slug =
      desiredSlug === existing.slug
        ? existing.slug
        : await ensureUniqueSlug(
            desiredSlug,
            async (candidate) => {
              const found = await prisma.product.findUnique({ where: { slug: candidate } });
              return Boolean(found && found.id !== id);
            },
            'produk',
          );

    const product = await prisma.$transaction(async (client) => {
      await client.productImage.deleteMany({ where: { productId: id } });
      await client.productVariant.deleteMany({ where: { productId: id } });

      return client.product.update({
        where: { id },
        data: {
          name: input.name,
          slug,
          shortDescription: input.shortDescription,
          description: input.description,
          ingredients: input.ingredients,
          servingSuggestion: input.servingSuggestion,
          storageSuggestion: input.storageSuggestion,
          contentLabel: input.contentLabel,
          weightGram: input.weightGram,
          categoryId: input.categoryId,
          price: input.price,
          discountPrice: input.discountPrice,
          isPromo: input.isPromo,
          promoEndsAt: input.promoEndsAt ? new Date(input.promoEndsAt) : null,
          image: input.image,
          stock: input.stock,
          isAvailable: input.isAvailable,
          isBestSeller: input.isBestSeller,
          isNewArrival: input.isNewArrival,
          isFeatured: input.isFeatured,
          isPublished: input.isPublished,
          images: {
            create: input.gallery.map((url, index) => ({
              url,
              alt: input.name,
              sortOrder: index,
            })),
          },
          variants: {
            create: input.variants.map((variant, index) => ({
              name: variant.name,
              priceAdjustment: variant.priceAdjustment,
              isDefault: variant.isDefault ?? index === 0,
              sortOrder: index,
            })),
          },
        },
      });
    });

    await logActivity({
      actor: session.username,
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      description: `Memperbarui produk "${product.name}".`,
    });

    return Response.json({ ok: true, product: { id: product.id, slug: product.slug } });
  } catch (error) {
    return errorResponse(error, 'Gagal memperbarui produk.');
  }
}

/**
 * PATCH /api/admin/products/[id] — perbarui stok saja (aksi cepat di tabel).
 * Body: { stock }.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = stockUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Stok tidak valid.' },
        { status: 400 },
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stock: parsed.data.stock },
    });

    await logActivity({
      actor: session.username,
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      description: `Mengubah stok "${product.name}" menjadi ${parsed.data.stock}.`,
    });

    return Response.json({ ok: true, id: product.id, stock: product.stock });
  } catch (error) {
    return errorResponse(error, 'Gagal memperbarui stok.');
  }
}

/**
 * DELETE /api/admin/products/[id] — hapus produk.
 * Produk yang pernah dipesan tidak dihapus permanen; produk disembunyikan
 * (isPublished=false) agar riwayat pesanan tetap utuh.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderItemCount > 0) {
      const product = await prisma.product.update({
        where: { id },
        data: { isPublished: false, isAvailable: false },
      });
      await logActivity({
        actor: session.username,
        action: 'UPDATE',
        entity: 'Product',
        entityId: id,
        description: `Produk "${product.name}" dinonaktifkan karena sudah pernah dipesan (riwayat pesanan dijaga).`,
      });
      return Response.json({
        ok: true,
        mode: 'archived',
        message:
          'Produk sudah pernah dipesan sehingga tidak dihapus permanen. Produk dinonaktifkan (tidak tampil di katalog).',
      });
    }

    const product = await prisma.product.delete({ where: { id } });
    await logActivity({
      actor: session.username,
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      description: `Menghapus produk "${product.name}".`,
    });

    return Response.json({ ok: true, mode: 'deleted' });
  } catch (error) {
    return errorResponse(error, 'Gagal menghapus produk.');
  }
}
