/**
 * Tipe data bersama antara server dan client (DTO).
 * Semua nilai Date di sini sudah dalam bentuk string ISO karena melewati
 * batas serialisasi JSON/RSC.
 */
import type { OrderStatusValue } from '../lib/constants';

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
};

export type ProductCategoryRef = {
  id: string;
  name: string;
  slug: string;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  contentLabel: string;
  price: number;
  discountPrice: number | null;
  finalPrice: number;
  discountPercent: number | null;
  isPromo: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isAvailable: boolean;
  isSoldOut: boolean;
  image: string;
  stock: number;
  soldCount: number;
  createdAt: string;
  category: ProductCategoryRef;
};

export type ProductVariantView = {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  finalPrice: number;
};

export type ProductImageView = {
  id: string;
  url: string;
  alt: string | null;
};

export type ProductDetail = ProductListItem & {
  description: string;
  ingredients: string | null;
  servingSuggestion: string | null;
  storageSuggestion: string | null;
  weightGram: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  promoEndsAt: string | null;
  gallery: ProductImageView[];
  variants: ProductVariantView[];
  updatedAt: string;
};

/** Baris katalog untuk tabel admin (termasuk data yang tidak tampil publik). */
export type AdminProductRow = ProductListItem & {
  isPublished: boolean;
  isFeatured: boolean;
  variantCount: number;
  updatedAt: string;
};

export type ProductListResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/** Item keranjang yang disimpan di localStorage browser. */
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  addedAt: number;
};

export type CartPricing = {
  subtotal: number;
  totalQuantity: number;
  totalItems: number;
};

export type CartNotice = {
  /** Pesan yang ditampilkan di UI persis seperti pada spesifikasi. */
  priceUpdated: boolean;
  stockAdjusted: boolean;
  removed: boolean;
  removedNames: string[];
  adjustedNames: string[];
  priceChangedNames: string[];
};

/** Baris keranjang hasil revalidasi server (harga & stok asli dari database). */
export type ValidatedCartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  requestedQuantity: number;
  quantity: number;
  stock: number;
  isAvailable: boolean;
  priceChanged: boolean;
  stockAdjusted: boolean;
};

export type CartValidationResponse = {
  items: ValidatedCartLine[];
  pricing: CartPricing;
  notice: CartNotice;
};

export type OrderItemView = {
  id: string;
  productId: string | null;
  productName: string;
  variantName: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string | null;
  fulfillment: 'PICKUP' | 'DELIVERY';
  note: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatusValue;
  stockCommitted: boolean;
  items: OrderItemView[];
  createdAt: string;
  updatedAt: string;
};

export type OrderListResponse = {
  items: OrderView[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  updatedAt: string;
};

export type ArticleDetail = ArticleListItem & {
  content: string;
};

export type TestimonialView = {
  id: string;
  name: string;
  role: string | null;
  rating: number;
  content: string;
  photo: string | null;
  isVisible: boolean;
  isDemoData: boolean;
  sortOrder: number;
};

export type DashboardStats = {
  revenueTotal: number;
  revenueThisMonth: number;
  orderCount: number;
  pendingOrderCount: number;
  completedOrderCount: number;
  productCount: number;
  publishedProductCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryCount: number;
  articleCount: number;
  draftArticleCount: number;
  testimonialCount: number;
  averageRating: number | null;
  bestSellers: { id: string; name: string; slug: string; soldCount: number; stock: number }[];
  lowStockProducts: { id: string; name: string; stock: number }[];
  recentOrders: OrderView[];
  salesByDay: { date: string; total: number; orders: number }[];
};

export type ApiError = {
  error: string;
  details?: { path: string; message: string }[];
};

export type OrderCreateResponse = {
  order: OrderView;
  whatsappUrl: string | null;
  message: string;
  notice: CartNotice;
  priceUpdateNote: string | null;
  stockAdjustNote: string | null;
  removedNote: string | null;
};
