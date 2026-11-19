import { prisma } from '@/lib/prisma';
import { assertSameOrigin, errorResponse, requireAdmin } from '@/lib/auth';
import { testimonialInputSchema } from '@/lib/validation';
import { logActivity } from '@/lib/activity';

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/testimonials/[id] — perbarui testimoni. */
export async function PUT(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Testimoni tidak ditemukan.' }, { status: 404 });
    }

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
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name: input.name,
        role: input.role,
        rating: input.rating,
        content: input.content,
        photo: input.photo,
        isVisible: input.isVisible,
        isDemoData: input.isDemoData,
      },
    });

    await logActivity({
      actor: session.username,
      action: 'UPDATE',
      entity: 'Testimonial',
      entityId: id,
      description: `Memperbarui testimoni dari "${testimonial.name}".`,
    });

    return Response.json({ ok: true, testimonial: { id: testimonial.id } });
  } catch (error) {
    return errorResponse(error, 'Gagal memperbarui testimoni.');
  }
}

/** DELETE /api/admin/testimonials/[id] — hapus testimoni. */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await assertSameOrigin(request);
    const session = await requireAdmin();
    const { id } = await params;

    const testimonial = await prisma.testimonial.delete({ where: { id } });
    await logActivity({
      actor: session.username,
      action: 'DELETE',
      entity: 'Testimonial',
      entityId: id,
      description: `Menghapus testimoni dari "${testimonial.name}".`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'Gagal menghapus testimoni.');
  }
}
