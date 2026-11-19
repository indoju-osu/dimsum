import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { listAdminProducts } from '@/lib/admin-data';
import { productInputSchema } from '@/lib/validation';
import { adminProductQuerySchema } from '@/lib/validation';
import { ensureUniqueSlug } from '@/lib/slug';
import { logActivity } from '@/lib/activity';

/** GET /api/admin/products — daftar produk dengan filter untuk tabel admin. */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const parsed = adminProductQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return Response.json({ error: 'Parameter filter tidak valid.' }, { status: 400 });
    }

    const result = await listAdminProducts(parsed.data);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat daftar produk.');
  }
}

/**
 * POST /api/admin/products — tambah produk baru.
 * Foto memakai path lokal (/images/...) atau URL https; tidak ada upload ke
 * filesystem karena deployment Vercel bersifat read-only.
 */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();

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

    const slug = await ensureUniqueSlug(input.slug || input.name, async (candidate) => {
      const existing = await prisma.product.findUnique({ where: { slug: candidate } });
      return Boolean(existing);
    }, 'produk');

    const product = await prisma.product.create({
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
          create: input.gallery.map((url, index) => ({ url, alt: input.name, sortOrder: index })),
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
      include: { category: true, images: true, variants: true },
    });

    await logActivity({
      actor: session.username,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      description: `Menambahkan produk "${product.name}".`,
    });

    return Response.json({ ok: true, product: { id: product.id, slug: product.slug } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Gagal menyimpan produk.');
  }
}
