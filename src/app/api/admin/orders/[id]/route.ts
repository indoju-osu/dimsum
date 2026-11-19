import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { getOrderById } from '@/lib/admin-data';
import { OrderError, updateOrderStatus } from '@/lib/order';
import { orderStatusSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';
import { ORDER_STATUS_LABEL } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/orders/[id] — detail satu pesanan. */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await getOrderById(id);
    if (!order) {
      return Response.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    return Response.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat pesanan.');
  }
}

/**
 * PATCH /api/admin/orders/[id] — ubah status pesanan.
 * Stok dipotong atomik saat status menjadi PROCESSING dan dikembalikan bila
 * pesanan dibatalkan (lihat updateOrderStatus di src/lib/order.ts).
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Status pesanan tidak valid.' }, { status: 400 });
    }

    const order = await updateOrderStatus(id, parsed.data.status);

    await logActivity({
      actor: session.username,
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: id,
      description: `Mengubah status pesanan ${order.orderNumber} menjadi ${ORDER_STATUS_LABEL[parsed.data.status]}.`,
    });

    return Response.json({ ok: true, order });
  } catch (error) {
    if (error instanceof OrderError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error, 'Gagal mengubah status pesanan.');
  }
}
