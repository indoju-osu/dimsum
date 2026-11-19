import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { getStoreSettings } from '@/lib/settings';
import { settingsInputSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';

/** GET /api/admin/settings — pengaturan toko saat ini. */
export async function GET() {
  try {
    await requireAdmin();
    const settings = await getStoreSettings();
    return Response.json({ settings }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat pengaturan toko.');
  }
}

/**
 * PUT /api/admin/settings — simpan pengaturan toko.
 * Nomor WhatsApp hanya disimpan bila benar-benar diisi pemilik usaha; aplikasi
 * tidak pernah mengarang nomor.
 */
export async function PUT(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = settingsInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Pengaturan tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        brandName: input.brandName,
        logo: input.logo,
        favicon: input.favicon,
        description: input.description,
        whatsappNumber: input.whatsappNumber,
        address: input.address ?? '',
        operatingHours: input.operatingHours ?? '',
        instagram: input.instagram,
        tiktok: input.tiktok,
        email: input.email,
        shippingInfo: input.shippingInfo ?? '',
        paymentInfo: input.paymentInfo ?? '',
        shippingCost: input.shippingCost,
        freeShippingMin: input.freeShippingMin,
        seoTitle: input.seoTitle ?? '',
        seoDescription: input.seoDescription ?? '',
        seoKeywords: input.seoKeywords ?? '',
      },
      update: {
        brandName: input.brandName,
        logo: input.logo,
        favicon: input.favicon,
        description: input.description,
        whatsappNumber: input.whatsappNumber,
        address: input.address ?? '',
        operatingHours: input.operatingHours ?? '',
        instagram: input.instagram,
        tiktok: input.tiktok,
        email: input.email,
        shippingInfo: input.shippingInfo ?? '',
        paymentInfo: input.paymentInfo ?? '',
        shippingCost: input.shippingCost,
        freeShippingMin: input.freeShippingMin,
        seoTitle: input.seoTitle ?? '',
        seoDescription: input.seoDescription ?? '',
        seoKeywords: input.seoKeywords ?? '',
      },
    });

    await logActivity({
      actor: session.username,
      action: 'UPDATE',
      entity: 'StoreSettings',
      entityId: settings.id,
      description: 'Memperbarui pengaturan toko.',
    });

    return Response.json({ ok: true, updatedAt: settings.updatedAt.toISOString() });
  } catch (error) {
    return errorResponse(error, 'Gagal menyimpan pengaturan toko.');
  }
}
