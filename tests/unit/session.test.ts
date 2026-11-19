/**
 * Unit test: cookie sesi admin bertanda tangan HMAC (src/lib/session.ts).
 *
 * Fokus keamanan: tanda tangan tidak dapat dipalsukan, token kedaluwarsa
 * ditolak, dan secret berbeda menghasilkan token yang tidak valid.
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { createSessionToken, sessionCookieOptions, verifySessionToken } from '@/lib/session';

const SECRET = 'rahasia-uji-yang-cukup-panjang-1234567890';

const payload = { sub: 'user-1', username: 'admin', role: 'ADMIN' as const };

describe('createSessionToken & verifySessionToken', () => {
  it('membuat token yang dapat diverifikasi kembali', async () => {
    const token = await createSessionToken(payload, { secret: SECRET, maxAgeSeconds: 3600 });
    const verified = await verifySessionToken(token, SECRET);
    expect(verified?.username).toBe('admin');
    expect(verified?.sub).toBe('user-1');
    expect(verified?.role).toBe('ADMIN');
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('menolak token dengan payload yang diubah', async () => {
    const token = await createSessionToken(payload, { secret: SECRET, maxAgeSeconds: 3600 });
    const [payloadSegment] = token.split('.') as [string, string];
    const forged = `${Buffer.from(
      JSON.stringify({ ...payload, username: 'penyusup', exp: 9_999_999_999 }),
    ).toString('base64url')}.${payloadSegment}`;
    expect(await verifySessionToken(forged, SECRET)).toBeNull();
  });

  it('menolak token yang ditandatangani dengan secret lain', async () => {
    const token = await createSessionToken(payload, {
      secret: 'secret-lain-yang-juga-panjang-0987654321',
      maxAgeSeconds: 3600,
    });
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it('menolak token yang sudah kedaluwarsa', async () => {
    const token = await createSessionToken(payload, { secret: SECRET, maxAgeSeconds: -60 });
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it('menolak nilai kosong atau bentuk token yang salah', async () => {
    expect(await verifySessionToken(null, SECRET)).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
    expect(await verifySessionToken('', SECRET)).toBeNull();
    expect(await verifySessionToken('bukan.token.tiga', SECRET)).toBeNull();
    expect(await verifySessionToken('hanya-satu-bagian', SECRET)).toBeNull();
  });

  it('menolak verifikasi ketika secret tidak memenuhi panjang minimum', async () => {
    const token = await createSessionToken(payload, { secret: SECRET, maxAgeSeconds: 3600 });
    expect(await verifySessionToken(token, 'pendek')).toBeNull();
  });

  it('melempar error saat SESSION_SECRET tidak diatur', async () => {
    vi.stubEnv('SESSION_SECRET', '');
    await expect(createSessionToken(payload, { maxAgeSeconds: 3600 })).rejects.toThrow(
      /SESSION_SECRET/,
    );
    vi.unstubAllEnvs();
  });
});

describe('sessionCookieOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('selalu HttpOnly, SameSite=Lax, dan Path=/', () => {
    const options = sessionCookieOptions(3600);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
    expect(options.maxAge).toBe(3600);
  });

  it('memaksa cookie Secure pada produksi', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(sessionCookieOptions(60).secure).toBe(true);
  });

  it('mengizinkan cookie non-Secure hanya di pengembangan eksplisit', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ALLOW_INSECURE_COOKIES', '1');
    expect(sessionCookieOptions(60).secure).toBe(false);

    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'development');
    expect(sessionCookieOptions(60).secure).toBe(true);
  });
});
