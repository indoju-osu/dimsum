/**
 * Utilitas sanitasi input.
 *
 * Strategi anti-XSS aplikasi ini:
 * 1. Semua input divalidasi dengan Zod (src/lib/validation.ts).
 * 2. Semua output dirender oleh React sehingga otomatis di-escape
 *    (tidak ada penggunaan dangerousSetInnerHTML / dangerouslySetInnerHTML).
 * 3. Fungsi di bawah membersihkan karakter kontrol dan opsional membuang tag
 *    HTML sebagai lapisan pertahanan tambahan (defense in depth), terutama
 *    untuk nilai yang ikut tersimpan dan dirender di banyak tempat
 *    (mis. nama pelanggan pada pesanan WhatsApp & dashboard admin).
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG = /<\/?[a-zA-Z][^>]*>/g;
const DANGEROUS_URL_SCHEME = /^\s*(javascript|data|vbscript)\s*:/i;

/** Buang karakter kontrol yang tidak dapat ditampilkan. */
export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, '');
}

/** Ubah seluruh tag HTML menjadi teks biasa. */
export function stripHtmlTags(value: string): string {
  return value.replace(HTML_TAG, '');
}

/** Rapikan spasi berlebih pada teks satu baris. */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export type SanitizeOptions = {
  maxLength?: number;
  /** Buang tag HTML (default true). */
  stripTags?: boolean;
  /** Izinkan baris baru (untuk catatan / konten multi-baris). */
  multiline?: boolean;
};

/**
 * Sanitasi teks yang berasal dari pengguna sebelum disimpan.
 * Hasilnya tetap berupa teks biasa — tidak pernah diinterpretasikan sebagai HTML.
 */
export function sanitizeText(value: string, options: SanitizeOptions = {}): string {
  const { maxLength = 2000, stripTags = true, multiline = false } = options;
  let output = stripControlChars(value);
  if (stripTags) output = stripHtmlTags(output);
  output = multiline
    ? output
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : collapseWhitespace(output);
  return output.slice(0, maxLength);
}

/** Normalisasi nomor telepon/WhatsApp: hanya digit, boleh diawali 62. */
export function sanitizePhoneNumber(value: string): string {
  const digits = value.replace(/[^\d+]/g, '').replace(/\+/g, '').replace(/^0+/, '');
  return digits.slice(0, 15);
}

/** Apakah URL aman dipakai sebagai sumber gambar (relatif atau https). */
export function isSafeImageSource(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (DANGEROUS_URL_SCHEME.test(trimmed)) return false;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  if (trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('data:image/')) return false; // hindari gambar inline besar
  return false;
}

/** Escape teks bila harus ditempatkan pada konteks HTML (mis. JSON-LD tidak perlu). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Amankan string sebelum disisipkan ke output JSON-LD (script tag).
 * Mencegah penutupan tag script secara dini.
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
