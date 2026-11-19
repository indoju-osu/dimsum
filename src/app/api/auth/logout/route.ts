import { cookies } from 'next/headers';
import { assertSameOrigin, errorResponse, getAdminSession } from '@/lib/auth';
import { clearSessionCookieOptions } from '@/lib/session';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { logActivity } from '@/lib/activity';

/** POST /api/auth/logout — hapus cookie sesi admin. */
export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const session = await getAdminSession();

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', clearSessionCookieOptions());

    if (session) {
      await logActivity({
        actor: session.username,
        action: 'LOGOUT',
        entity: 'User',
        entityId: session.sub,
        description: `Admin "${session.username}" logout.`,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'Logout gagal diproses.');
  }
}
