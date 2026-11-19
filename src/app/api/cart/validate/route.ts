import { assertSameOrigin, errorResponse } from '@/lib/auth';
import { revalidateCart } from '@/lib/order';
import { cartValidationSchema } from '@/lib/validation';
import type { CartValidationResponse } from '@/types';

/**
 * POST /api/cart/validate — sinkronkan keranjang dengan database.
 *
 * Harga, ketersediaan, dan stok SELALU diambil ulang dari server. Harga yang
 * dikirim browser hanya dipakai untuk mendeteksi perubahan agar pengguna
 * mendapat pemberitahuan (lihat CART_NOTICE_MESSAGE di src/lib/cart.ts).
 */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);

    const body = await request.json().catch(() => null);
    const parsed = cartValidationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data keranjang tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const revalidation = await revalidateCart(parsed.data.items);
    const response: CartValidationResponse = {
      items: revalidation.items,
      pricing: revalidation.pricing,
      notice: revalidation.notice,
    };

    return Response.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memvalidasi keranjang.');
  }
}
