/**
 * Rate limiter sederhana berbasis memori proses.
 *
 * KETERBATASAN YANG PERLU DIKETAHUI:
 * - Hitungan disimpan pada memori satu instance server. Pada deployment
 *   serverless/multi-instance (mis. Vercel dengan beberapa lambda), setiap
 *   instance memiliki hitungan sendiri sehingga batas efektif dapat lebih
 *   longgar. Fungsi ini tetap berguna untuk meredam brute force dasar.
 * - Untuk skala produksi yang lebih ketat, ganti implementasi di bawah dengan
 *   penyimpanan bersama seperti Redis/Upstash sambil mempertahankan antarmuka
 *   `consume()` yang sama.
 *
 * `consume()` mengembalikan sisa kuota dan waktu tunggu sehingga pemanggil
 * dapat mengirim header Retry-After.
 */

type Bucket = {
  count: number;
  resetAt: number;
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function pruneIfNeeded(now: number) {
  if (buckets.size <= MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now && bucket.blockedUntil <= now) buckets.delete(key);
  }
  if (buckets.size > MAX_KEYS) buckets.clear();
}

export type RateLimitOptions = {
  /** Jumlah percobaan yang diizinkan dalam satu jendela waktu. */
  limit: number;
  /** Panjang jendela waktu dalam detik. */
  windowSeconds: number;
  /** Lama blokir setelah limit terlampaui (detik). */
  blockSeconds?: number;
};

export function consume(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneIfNeeded(now);

  const windowMs = options.windowSeconds * 1000;
  const blockMs = (options.blockSeconds ?? options.windowSeconds) * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs, blockedUntil: 0 });
    return { allowed: true, remaining: Math.max(0, options.limit - 1), retryAfterSeconds: 0 };
  }

  if (existing.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - now) / 1000),
    };
  }

  existing.count += 1;
  if (existing.count > options.limit) {
    existing.blockedUntil = now + blockMs;
    existing.resetAt = now + windowMs;
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil(blockMs / 1000) };
  }

  return { allowed: true, remaining: Math.max(0, options.limit - existing.count), retryAfterSeconds: 0 };
}

/** Kosongkan hitungan untuk sebuah key (mis. setelah login berhasil). */
export function reset(key: string): void {
  buckets.delete(key);
}

/** Hitung mundur aktif untuk sebuah key (detik), 0 bila tidak diblokir. */
export function retryAfter(key: string): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  const remaining = bucket.blockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
