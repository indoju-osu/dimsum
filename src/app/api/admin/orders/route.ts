import { z } from 'zod';
import { errorResponse, requireAdmin } from '@/lib/auth';
import { listOrders } from '@/lib/admin-data';
import { ORDER_STATUS_VALUES } from '@/lib/constants';
import { sanitizeText } from '@/lib/sanitization';

const orderQuerySchema = z.object({
  search: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ? sanitizeText(value, { maxLength: 80 }) : '')),
  status: z.union([z.literal('all'), z.enum(ORDER_STATUS_VALUES)]).default('all'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(20),
});

/** GET /api/admin/orders — daftar pesanan dengan filter status & pencarian. */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const parsed = orderQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return Response.json({ error: 'Parameter filter pesanan tidak valid.' }, { status: 400 });
    }

    const result = await listOrders(parsed.data);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat daftar pesanan.');
  }
}
