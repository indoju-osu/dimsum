import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { DEMO_RESET_CONFIRMATION, resetDemoData } from '@/lib/demo-reset';

/**
 * POST /api/admin/settings/reset-demo — memulihkan data demo.
 *
 * Pengamanan:
 * - Wajib sesi admin + origin yang sama (CSRF).
 * - Wajib frasa konfirmasi "RESET DATA DEMO".
 * - Ditolak pada NODE_ENV=production kecuali ALLOW_DEMO_RESET=true.
 * - Hanya menyentuh data demo: pengaturan toko, akun admin, dan pesanan asli
 *   pelanggan tidak diubah (lihat src/lib/demo-reset.ts).
 */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();

    const body: { confirm?: unknown } | null = await request.json().catch(() => null);
    const confirm = typeof body?.confirm === 'string' ? body.confirm.trim().toUpperCase() : '';
    if (confirm !== DEMO_RESET_CONFIRMATION) {
      return Response.json(
        { error: `Ketik "${DEMO_RESET_CONFIRMATION}" untuk mengonfirmasi tindakan ini.` },
        { status: 400 },
      );
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_RESET !== 'true') {
      return Response.json(
        {
          error:
            'Reset data demo dinonaktifkan pada lingkungan produksi untuk melindungi data asli. Setel ALLOW_DEMO_RESET=true bila memang ingin menjalankannya.',
        },
        { status: 403 },
      );
    }

    const result = await resetDemoData({ actor: session.username });

    return Response.json({
      ok: true,
      message: `Data demo dipulihkan: ${result.products} produk, ${result.categories} kategori, ${result.articles} artikel, ${result.testimonials} testimoni, ${result.orders} pesanan contoh.`,
      result,
    });
  } catch (error) {
    return errorResponse(error, 'Gagal mereset data demo.');
  }
}
