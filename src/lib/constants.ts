/** Konstanta bersama untuk label, navigasi, dan batas validasi. */

export const SITE_NAME_FALLBACK = 'Dimsum Kita';

export const PUBLIC_NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/products', label: 'Semua Produk' },
  { href: '/promotions', label: 'Promo' },
  { href: '/articles', label: 'Artikel' },
  { href: '/about', label: 'Tentang Kami' },
] as const;

export const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/products', label: 'Produk', icon: 'products' },
  { href: '/admin/categories', label: 'Kategori', icon: 'categories' },
  { href: '/admin/orders', label: 'Pesanan', icon: 'orders' },
  { href: '/admin/articles', label: 'Artikel', icon: 'articles' },
  { href: '/admin/testimonials', label: 'Testimoni', icon: 'testimonials' },
  { href: '/admin/settings', label: 'Pengaturan Toko', icon: 'settings' },
] as const;

export const ORDER_STATUS_VALUES = [
  'PENDING_CONFIRMATION',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING_CONFIRMATION: 'Menunggu Konfirmasi',
  PROCESSING: 'Diproses',
  READY_FOR_PICKUP: 'Siap Diambil',
  SHIPPING: 'Dalam Pengiriman',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const ORDER_STATUS_TONE: Record<OrderStatusValue, string> = {
  PENDING_CONFIRMATION: 'bg-harvest/20 text-forest border-harvest/40',
  PROCESSING: 'bg-olive/15 text-forest border-olive/40',
  READY_FOR_PICKUP: 'bg-sand/40 text-forest border-sand',
  SHIPPING: 'bg-sand/40 text-forest border-sand',
  COMPLETED: 'bg-forest/10 text-forest border-forest/30',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export const FULFILLMENT_LABEL = {
  PICKUP: 'Ambil sendiri',
  DELIVERY: 'Pengiriman',
} as const;

export const ARTICLE_STATUS_LABEL = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
} as const;

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Terpopuler' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'price-asc', label: 'Harga terendah' },
  { value: 'price-desc', label: 'Harga tertinggi' },
  { value: 'name-asc', label: 'Nama A-Z' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const CATALOG_PAGE_SIZE = 12;
export const CATALOG_MAX_PAGE_SIZE = 48;
export const ADMIN_PAGE_SIZE = 10;
export const LOW_STOCK_THRESHOLD = 5;

export const CART_STORAGE_KEY = 'dimsum-kita.cart.v1';
export const CART_MAX_QUANTITY = 99;
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const ALLOWED_UPLOAD_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

export const SESSION_COOKIE_NAME = 'dimsum_admin_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 jam
