import { errorResponse, requireAdmin } from '@/lib/auth';
import { getDashboardStats } from '@/lib/admin-data';
import { listRecentActivity } from '@/lib/activity';
import { getStoreSettings, missingConfigKeys } from '@/lib/settings';

/** GET /api/admin/dashboard — ringkasan statistik untuk dashboard admin. */
export async function GET() {
  try {
    await requireAdmin();

    const [stats, activity, settings] = await Promise.all([
      getDashboardStats(),
      listRecentActivity(8),
      getStoreSettings(),
    ]);

    return Response.json(
      {
        stats,
        activity,
        missingConfig: missingConfigKeys(settings),
        whatsappConfigured: settings.whatsappNumber.length >= 9,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error, 'Gagal memuat ringkasan dashboard.');
  }
}
