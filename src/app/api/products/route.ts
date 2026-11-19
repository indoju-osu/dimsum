import { listProducts } from '@/lib/database';
import { catalogQuerySchema } from '@/lib/validation';
import type { ProductListResponse } from '@/types';

/**
 * GET /api/products — katalog produk publik.
 *
 * Query: search, category, minPrice, maxPrice, bestSeller, promo, newArrival,
 * inStock, sort, page, perPage. Data selalu dibaca dari database; filter dan
 * pengurutan dilakukan setelah query Prisma yang berbatas.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const parsed = catalogQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Parameter pencarian tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path[0] ?? ''),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const result: ProductListResponse = await listProducts(parsed.data);
    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[api/products] Gagal memuat katalog:', error);
    return Response.json({ error: 'Gagal memuat katalog produk.' }, { status: 500 });
  }
}
