/**
 * Pembuatan slug unik untuk produk, kategori, dan artikel.
 *
 * Admin boleh mengosongkan slug; saat itu slug dibuat dari nama. Bila slug
 * sudah dipakai baris lain, ditambahkan akhiran -2, -3, dst.
 */
import { slugify } from './utils';

export async function ensureUniqueSlug(
  desired: string | null | undefined,
  isTaken: (slug: string) => Promise<boolean>,
  fallbackPrefix = 'item',
): Promise<string> {
  const base = slugify(desired ?? '') || `${fallbackPrefix}-${Date.now().toString(36)}`;

  let candidate = base;
  let counter = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
    if (counter > 100) {
      candidate = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}
