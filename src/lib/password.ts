/**
 * Hashing password admin.
 *
 * Implementasi default memakai `scrypt` dari modul `node:crypto` sehingga tidak
 * memerlukan dependensi native tambahan dan tetap aman untuk verifikasi.
 *
 * UNTUK PRODUKSI: disarankan memakai Argon2id (`argon2`) atau bcrypt
 * (`bcryptjs` / `bcrypt`). Ganti `hashPassword`/`verifyPassword` di bawah dan
 * jalankan ulang seed / fitur ganti password. Format hash selalu disimpan
 * dengan penanda skema di depan, sehingga migrasi skema hashing dapat
 * dilakukan bertahap tanpa merusak hash lama:
 *   `scrypt$<saltHex>$<hashHex>`
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_PREFIX = 'scrypt';

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${SCRYPT_PREFIX}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [scheme, saltHex, hashHex] = parts as [string, string, string];
  if (scheme !== SCRYPT_PREFIX) return false;

  let expected: Buffer;
  let salt: Buffer;
  try {
    salt = Buffer.from(saltHex, 'hex');
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = scryptSync(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Apakah hash memakai skema yang saat ini direkomendasikan. */
export function isSupportedHash(stored: string): boolean {
  return stored.startsWith(`${SCRYPT_PREFIX}$`);
}
