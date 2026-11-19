/**
 * Middleware proteksi area admin.
 *
 * Perilaku:
 * - `/admin/*` tanpa sesi valid  -> 307 redirect ke /admin/login?next=...
 * - `/api/admin/*` tanpa sesi     -> 401 JSON
 * - `/admin/login` saat sudah login -> redirect ke /admin
 *
 * Middleware berjalan di Edge Runtime, sehingga verifikasi memakai Web Crypto
 * (src/lib/session.ts). Route Handler tetap memanggil ulang `requireAdmin()`
 * sebagai pertahanan berlapis.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { verifySessionToken } from '@/lib/session';

const ADMIN_LOGIN_PATH = '/admin/login';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api/admin');
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (pathname === ADMIN_LOGIN_PATH) {
    if (session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses. Silakan login sebagai admin.' },
        { status: 401 },
      );
    }
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    const target = `${pathname}${search}`;
    if (target && target !== '/admin') loginUrl.searchParams.set('next', target);
    return NextResponse.redirect(loginUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
