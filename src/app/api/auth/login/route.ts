import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { verifyPassword } from '@/lib/password';
import { consume } from '@/lib/rate-limit';
import { assertSameOrigin, errorResponse, getClientIdentifier } from '@/lib/auth';
import { createSessionToken, sessionCookieOptions } from '@/lib/session';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/constants';
import { logActivity } from '@/lib/activity';

/**
 * POST /api/auth/login — login admin.
 *
 * Pengamanan: rate limit per IP (mencegah brute force), pemeriksaan same-origin
 * (mitigasi CSRF), validasi Zod, verifikasi password dengan scrypt, dan cookie
 * sesi HttpOnly ber-tanda tangan HMAC.
 */
export async function POST(request: Request) {
  try {
    const identifier = await getClientIdentifier(request);
    const limit = consume(`login:${identifier}`, {
      limit: 5,
      windowSeconds: 300,
      blockSeconds: 900,
    });
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60);
      return Response.json(
        {
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`,
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    await assertSameOrigin(request);

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Data login tidak valid.',
          details: parsed.error.issues.map((issue) => ({
            path: String(issue.path[0] ?? ''),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;
    const admin = await prisma.user.findUnique({ where: { username } });

    // Pesan error sengaja sama untuk username/password yang salah (tidak
    // membocorkan akun mana yang ada).
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      await logActivity({
        actor: `percobaan:${username}`,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: admin?.id ?? null,
        description: `Percobaan login gagal untuk username "${username}".`,
      });
      return Response.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    const token = await createSessionToken(
      { sub: admin.id, username: admin.username, role: 'ADMIN' },
      { maxAgeSeconds: SESSION_MAX_AGE_SECONDS },
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

    await prisma.user.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await logActivity({
      actor: admin.username,
      action: 'LOGIN',
      entity: 'AdminUser',
      entityId: admin.id,
      description: `Admin "${admin.username}" berhasil login.`,
    });

    return Response.json({ ok: true, username: admin.username });
  } catch (error) {
    return errorResponse(error, 'Login gagal diproses.');
  }
}
