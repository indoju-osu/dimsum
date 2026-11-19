import { AuthError, assertSameOrigin } from '@/lib/auth';
import { OrderError, createOrder } from '@/lib/order';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { orderInputSchema } from '@/lib/validation';
import { buildOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import type { OrderCreateResponse } from '@/types';

/**
 * POST /api/orders — buat pesanan baru dari checkout.
 *
 * Alur:
 * 1. Validasi same-origin (mitigasi CSRF) dan skema input.
 * 2. Harga & stok DIVALIDASI ULANG di server (nilai dari browser tidak dipakai
 *    untuk menghitung total).
 * 3. Pesanan disimpan dengan status PENDING_CONFIRMATION dan stok BELUM
 *    dipotong (dipotong atomik saat admin mengubah status ke PROCESSING).
 * 4. Tautan WhatsApp disusun dari nomor toko di pengaturan. Bila nomor belum
 *    diisi pemilik usaha, `whatsappUrl` bernilai null dan UI menampilkan
 *    pemberitahuan — nomor tidak pernah dikarang.
 */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);

    const body = await request.json().catch(() => null);
    const parsed = orderInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data pesanan tidak valid. Periksa kembali isian Anda.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const settings = await getStoreSettings();

    const result = await createOrder(input, {
      shippingCost: settings.shippingCost,
      freeShippingMin: settings.freeShippingMin,
    });

    const order = result.order;
    const message = buildOrderMessage({
      brandName: settings.brandName,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      fulfillment: order.fulfillment,
      address: order.address,
      note: order.note,
      items: order.items.map((item) => ({
        name: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      storeAddress: settings.address,
      pickupNote: settings.operatingHours,
      priceUpdateNote: result.priceUpdateNote,
      stockAdjustNote: result.stockAdjustNote,
      removedNote: result.removedNote,
    });

    const whatsappUrl = hasWhatsAppNumber(settings)
      ? buildWhatsAppUrl(settings.whatsappNumber, message)
      : null;

    const response: OrderCreateResponse = {
      order,
      whatsappUrl,
      message,
      notice: result.notice,
      priceUpdateNote: result.priceUpdateNote,
      stockAdjustNote: result.stockAdjustNote,
      removedNote: result.removedNote,
    };

    return Response.json(response, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof OrderError) {
      console.error('[api/orders] Pesanan ditolak:', error.message);
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/orders] Gagal membuat pesanan:', error);
    return Response.json(
      { error: 'Pesanan gagal diproses. Silakan coba lagi atau hubungi kami via WhatsApp.' },
      { status: 500 },
    );
  }
}
