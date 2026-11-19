/**
 * Manajemen sesi admin berbasis cookie bertanda tangan HMAC-SHA256.
 *
 * Implementasi memakai Web Crypto (`globalThis.crypto.subtle`) sehingga modul
 * yang sama dapat berjalan di Node.js (Route Handlers) maupun di Edge Runtime
 * (middleware). Tidak ada dependensi eksternal dan tidak ada data sensitif yang
 * disimpan di sisi client selain token yang sudah ditandatangani.
 *
 * Format token:  <base64url(payload)>.<base64url(hmacSha256(payload))>
 * Payload:       { sub, username, role, iat, exp }
 */

export type SessionPayload = {
  sub: string;
  username: string;
  role: 'ADMIN';
  iat: number;
  exp: number;
};

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] as number;
    const second = bytes[index + 1];
    const third = bytes[index + 2];

    output += BASE64URL_ALPHABET[first >> 2] as string;
    output += BASE64URL_ALPHABET[((first & 0x03) << 4) | ((second ?? 0) >> 4)] as string;
    if (second === undefined) break;
    output += BASE64URL_ALPHABET[((second & 0x0f) << 2) | ((third ?? 0) >> 6)] as string;
    if (third === undefined) break;
    output += BASE64URL_ALPHABET[third & 0x3f] as string;
  }
  return output;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const lookup = new Int16Array(128).fill(-1);
  for (let index = 0; index < BASE64URL_ALPHABET.length; index += 1) {
    lookup[BASE64URL_ALPHABET.charCodeAt(index)] = index;
  }

  const clean = value.replace(/=+$/u, '');
  // Buffer dialokasikan eksplisit sebagai ArrayBuffer agar tipe memenuhi
  // BufferSource pada Web Crypto (menghindari SharedArrayBuffer pada tipe).
  const output = new Uint8Array(new ArrayBuffer(Math.floor((clean.length * 6) / 8)));
  let buffer = 0;
  let bits = 0;
  let position = 0;

  for (const character of clean) {
    const code = character.charCodeAt(0);
    const mapped = code < 128 ? (lookup[code] ?? -1) : -1;
    if (mapped < 0) throw new Error('Token tidak valid');
    buffer = (buffer << 6) | mapped;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[position] = (buffer >> bits) & 0xff;
      position += 1;
    }
  }
  return new Uint8Array(output.subarray(0, position)) as Uint8Array<ArrayBuffer>;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payloadSegment: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payloadSegment));
  return bytesToBase64Url(new Uint8Array(signature));
}

function resolveSecret(secret?: string): string {
  const value = secret ?? process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      'SESSION_SECRET belum diatur (minimal 16 karakter). Salin .env.example menjadi .env lalu isi nilainya.',
    );
  }
  return value;
}

/** Buat token sesi bertanda tangan. */
export async function createSessionToken(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  options: { secret?: string; maxAgeSeconds: number },
): Promise<string> {
  const secret = resolveSecret(options.secret);
  const issuedAt = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + options.maxAgeSeconds,
  };
  const payloadSegment = bytesToBase64Url(encoder.encode(JSON.stringify(fullPayload)));
  const signatureSegment = await sign(payloadSegment, secret);
  return `${payloadSegment}.${signatureSegment}`;
}

/**
 * Verifikasi token: tanda tangan HMAC cocok DAN belum kedaluwarsa.
 * Mengembalikan null untuk semua bentuk token yang tidak valid.
 */
export async function verifySessionToken(
  token: string | undefined | null,
  secret?: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadSegment, signatureSegment] = parts as [string, string];
  if (!payloadSegment || !signatureSegment) return null;

  let resolvedSecret: string;
  try {
    resolvedSecret = resolveSecret(secret);
  } catch {
    return null;
  }

  try {
    const key = await importKey(resolvedSecret);
    const valid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signatureSegment),
      new Uint8Array(encoder.encode(payloadSegment)),
    );
    if (!valid) return null;

    const decoded = new TextDecoder().decode(base64UrlToBytes(payloadSegment));
    const parsed = JSON.parse(decoded) as Partial<SessionPayload>;
    if (
      typeof parsed.sub !== 'string' ||
      typeof parsed.username !== 'string' ||
      parsed.role !== 'ADMIN' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    if (parsed.exp * 1000 <= Date.now()) return null;

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

/** Opsi cookie sesi admin (HttpOnly, Secure di produksi, SameSite=Lax, Path=/). */
export function sessionCookieOptions(maxAgeSeconds: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowInsecure =
    process.env.ALLOW_INSECURE_COOKIES === '1' && process.env.NODE_ENV !== 'production';
  return {
    httpOnly: true,
    secure: isProduction || !allowInsecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function clearSessionCookieOptions() {
  return {
    ...sessionCookieOptions(0),
    maxAge: 0,
  };
}
