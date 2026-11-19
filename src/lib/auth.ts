/**
 * Helper autentikasi admin untuk Route Handlers dan Server Components.
 *
 * Keamanan:
 * - Sesi diverifikasi dari cookie HttpOnly bertanda tangan HMAC (src/lib/session.ts).
 * - Middleware melakukan pemeriksaan cepat (defense in depth) dan mengembalikan
 *   307 ke /admin/login untuk halaman, serta 401 untuk /api/admin/*.
 * - Setiap Route Handler yang mengubah data WAJIB memanggil `requireAdmin()`
 *   lagi di sisi server: middleware saja tidak cukup.
 * - Mutasi juga diperiksa asal-usulnya (same-origin) untuk mitigasi CSRF.
 */
import { cookies, headers } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';
import { verifySessionToken, type SessionPayload } from './session';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/** Baca payload sesi admin dari cookie; null bila tidak ada/tidak valid. */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/** Wajib login — melempar AuthError(401) bila sesi tidak valid. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new AuthError('Sesi tidak valid. Silakan login kembali.', 401);
  }
  return session;
}

function normaliseHost(value: string | null): string {
  if (!value) return '';
  return value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
}

/**
 * Verifikasi bahwa request berasal dari origin yang sama.
 * Melindungi Route Handler mutasi dari permintaan lintas situs (CSRF).
 */
export async function isSameOriginRequest(request: Request): Promise<boolean> {
  const headerStore = await headers();
  const originHeader = request.headers.get('origin') ?? headerStore.get('origin');
  const requestHost = normaliseHost(
    request.headers.get('x-forwarded-host') ??
      request.headers.get('host') ??
      headerStore.get('host'),
  );

  // Klien non-browser (mis. curl) tidak mengirim Origin. Tolak untuk mutasi,
  // karena semua mutasi aplikasi dilakukan oleh fetch dari halaman admin.
  if (!originHeader) return false;

  try {
    const originUrl = new URL(originHeader);
    const allowed = new Set<string>([requestHost]);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) allowed.add(normaliseHost(siteUrl));
    // Saat dev, terima localhost pada port apa pun yang sama host-nya.
    return allowed.has(normaliseHost(originUrl.host));
  } catch {
    return false;
  }
}

/** Bila request tidak same-origin, hasilkan response 403. */
export async function assertSameOrigin(request: Request): Promise<void> {
  const sameOrigin = await isSameOriginRequest(request);
  if (!sameOrigin) {
    throw new AuthError('Permintaan ditolak: asal permintaan tidak dikenal.', 403);
  }
}

/** Konversi error menjadi response JSON yang konsisten. */
export function errorResponse(error: unknown, fallbackMessage = 'Terjadi kesalahan pada server.') {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: fallbackMessage }, { status: 500 });
}

/** Response 401 standar untuk /api/admin/* tanpa sesi valid. */
export function unauthorizedResponse(message = 'Tidak memiliki akses. Silakan login sebagai admin.') {
  return Response.json({ error: message }, { status: 401 });
}

/** Dapatkan IP/nama host pemanggil untuk keperluan rate limit. */
export async function getClientIdentifier(request: Request): Promise<string> {
  const headerStore = await headers();
  const forwarded = request.headers.get('x-forwarded-for') ?? headerStore.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? headerStore.get('x-real-ip') ?? 'unknown';
}
