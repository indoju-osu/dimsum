import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { listAdminTestimonials } from '@/lib/admin-data';
import { testimonialInputSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';

/** GET /api/admin/testimonials — seluruh testimoni (termasuk yang disembunyikan). */
export async function GET() {
  try {
    await requireAdmin();
    const items = await listAdminTestimonials();
    return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, 'Gagal memuat testimoni.');
  }
}

/** POST /api/admin/testimonials — tambah testimoni. */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();

    const body = await request.json().catch(() => null);
    const parsed = testimonialInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data testimoni tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path.join('.')),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const last = await prisma.testimonial.findFirst({ orderBy: { sortOrder: 'desc' } });

    const testimonial = await prisma.testimonial.create({
      data: {
        name: input.name,
        role: input.role,
        rating: input.rating,
        content: input.content,
        photo: input.photo,
        isVisible: input.isVisible,
        // Testimoni buatan admin memakai data asli pelanggan; tandai contoh hanya
        // bila admin secara eksplisit menyimpannya sebagai data demo.
        isDemoData: input.isDemoData,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });

    await logActivity({
      actor: session.username,
      action: 'CREATE',
      entity: 'Testimonial',
      entityId: testimonial.id,
      description: `Menambahkan testimoni dari "${testimonial.name}".`,
    });

    return Response.json({ ok: true, testimonial: { id: testimonial.id } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Gagal menyimpan testimoni.');
  }
}
