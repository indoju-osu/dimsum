/**
 * Unit test: sanitasi input & pemformatan (src/lib/sanitization.ts, src/lib/format.ts).
 *
 * Fokus anti-XSS: tag HTML dibuang, skema URL berbahaya ditolak, dan JSON-LD
 * tidak dapat menutup tag <script> lebih awal.
 */
import { describe, it, expect } from 'vitest';
import {
  collapseWhitespace,
  escapeHtml,
  isSafeImageSource,
  safeJsonForScript,
  sanitizePhoneNumber,
  sanitizeText,
  stripControlChars,
  stripHtmlTags,
} from '@/lib/sanitization';
import { discountPercent, formatDate, formatNumber, formatRupiah } from '@/lib/format';

describe('sanitizeText', () => {
  it('membuang tag HTML dan merapikan spasi', () => {
    expect(sanitizeText('<script>alert(1)</script>  Dimsum   Ayam')).toBe('alert(1) Dimsum Ayam');
  });

  it('memotong teks sesuai maxLength', () => {
    expect(sanitizeText('abcdefghij', { maxLength: 4 })).toBe('abcd');
  });

  it('mempertahankan baris baru ketika multiline', () => {
    const value = 'Baris satu\n\n\n\nBaris dua';
    expect(sanitizeText(value, { multiline: true })).toBe('Baris satu\n\nBaris dua');
  });
});

describe('stripHtmlTags & stripControlChars', () => {
  it('mengubah tag menjadi teks biasa', () => {
    expect(stripHtmlTags('<p>Halo <b>dunia</b></p>')).toBe('Halo dunia');
  });

  it('membuang karakter kontrol', () => {
    expect(stripControlChars('A\u0000B\u0007C')).toBe('ABC');
  });
});

describe('sanitizePhoneNumber', () => {
  it('menyisakan digit, membuang awalan 0, dan membatasi 15 digit', () => {
    expect(sanitizePhoneNumber('0812-3456-7890')).toBe('81234567890');
    expect(sanitizePhoneNumber('+62 812 3456 7890')).toBe('6281234567890');
    expect(sanitizePhoneNumber('1234567890123456789')).toHaveLength(15);
  });
});

describe('isSafeImageSource', () => {
  it('menerima path lokal dan URL https', () => {
    expect(isSafeImageSource('/images/products/dimsum.webp')).toBe(true);
    expect(isSafeImageSource('https://contoh.test/foto.webp')).toBe(true);
  });

  it('menolak skema berbahaya, protokol-relative, dan nilai kosong', () => {
    expect(isSafeImageSource('javascript:alert(1)')).toBe(false);
    expect(isSafeImageSource('data:image/svg+xml,<svg/>')).toBe(false);
    expect(isSafeImageSource('//evil.test/foto.webp')).toBe(false);
    expect(isSafeImageSource('http://contoh.test/foto.webp')).toBe(false);
    expect(isSafeImageSource('   ')).toBe(false);
  });
});

describe('escapeHtml & safeJsonForScript', () => {
  it('meng-escape karakter khusus HTML', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });

  it('meng-escape < dan > agar tidak menutup tag script', () => {
    const json = safeJsonForScript({ nama: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('</script>');
    expect(json).toContain('\\u003c/script\\u003e');
  });
});

describe('format', () => {
  it('memformat rupiah tanpa desimal', () => {
    expect(formatRupiah(25000)).toBe('Rp25.000');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(null)).toBe('Rp0');
    expect(formatRupiah(Number.NaN)).toBe('Rp0');
  });

  it('memformat angka dengan pemisah ribuan', () => {
    expect(formatNumber(12500)).toBe('12.500');
  });

  it('menangani tanggal tidak valid', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('bukan-tanggal')).toBe('-');
    expect(formatDate(new Date('2026-11-19T00:00:00.000Z'))).toContain('2026');
  });

  it('menghitung persentase diskon hanya bila lebih murah', () => {
    expect(discountPercent(25000, 20000)).toBe(20);
    expect(discountPercent(25000, null)).toBeNull();
    expect(discountPercent(25000, 25000)).toBeNull();
    expect(discountPercent(25000, 30000)).toBeNull();
  });
});
