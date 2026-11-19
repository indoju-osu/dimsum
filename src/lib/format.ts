/** Pemformatan angka, mata uang, dan tanggal dalam lokal Indonesia. */

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Rp18.000 */
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Rp0';
  return currencyFormatter.format(Math.round(value)).replace(/\u00a0/g, '');
}

/** 12500 -> "12.500" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** 19 November 2026 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return dateFormatter.format(date);
}

/** 19 Nov 2026, 14.30 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return dateTimeFormatter.format(date);
}

/** Persentase diskon dari harga normal dan harga diskon. */
export function discountPercent(price: number, discountPrice: number | null): number | null {
  if (!discountPrice || discountPrice <= 0 || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}
