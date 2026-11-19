/**
 * Lapisan akses data publik (server-only).
 *
 * Catatan skala: katalog UMKM ini berisi puluhan produk, sehingga penyaringan,
 * pengurutan (termasuk urutan berdasarkan harga setelah diskon), dan paginasi
 * dilakukan di memori setelah query Prisma dengan batas aman. Cara ini menjaga
 * konsistensi harga final di seluruh halaman. Untuk katalog yang jauh lebih
 * besar, tambahkan kolom terhitung + indeks lalu pindahkan pengurutan ke SQL.
 */
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';
import { CATALOG_PAGE_SIZE } from './constants';
import { discountPercent } from './format';
import type { CatalogQuery } from './validation';
import type {
  ArticleDetail,
  ArticleListItem,
  CategorySummary,
  ProductDetail,
  ProductListResponse,
  ProductListItem,
  TestimonialView,
} from '../types';

/** Batas jumlah baris yang dibaca sebelum pengurutan di memori. */
const CATALOG_FETCH_LIMIT = 500;

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  ingredients: string | null;
  servingSuggestion: string | null;
  storageSuggestion: string | null;
  contentLabel: string;
  weightGram: number | null;
  price: number;
  discountPrice: number | null;
  isPromo: boolean;
  promoEndsAt?: Date | null;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  isPublished: boolean;
  image: string;
  stock: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; alt: string | null }[];
  variants: { id: string; name: string; priceAdjustment: number; isDefault: boolean }[];
};

export const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { orderBy: { sortOrder: 'asc' } },
} as const;

export function toProductListItem(product: ProductRow): ProductListItem {
  const finalPrice = product.discountPrice ?? product.price;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    contentLabel: product.contentLabel,
    price: product.price,
    discountPrice: product.discountPrice,
    finalPrice,
    discountPercent: discountPercent(product.price, product.discountPrice),
    isPromo: product.isPromo && product.discountPrice !== null,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    isAvailable: product.isAvailable,
    isSoldOut: !product.isAvailable || product.stock <= 0,
    image: product.image,
    stock: product.stock,
    soldCount: product.soldCount,
    createdAt: product.createdAt.toISOString(),
    category: product.category,
  };
}

export function toProductDetail(product: ProductRow): ProductDetail {
  const item = toProductListItem(product);
  return {
    ...item,
    description: product.description,
    ingredients: product.ingredients,
    servingSuggestion: product.servingSuggestion,
    storageSuggestion: product.storageSuggestion,
    weightGram: product.weightGram,
    isPublished: product.isPublished,
    isFeatured: product.isFeatured,
    promoEndsAt: product.promoEndsAt ? product.promoEndsAt.toISOString() : null,
    gallery: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      priceAdjustment: variant.priceAdjustment,
      isDefault: variant.isDefault,
      finalPrice: item.finalPrice + variant.priceAdjustment,
    })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Kategori
// ---------------------------------------------------------------------------

export async function getCategories(options: { includeInactive?: boolean } = {}) {
  const categories = await prisma.category.findMany({
    where: options.includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { isPublished: true } } } } },
  });
  return categories.map<CategorySummary>((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount: category._count.products,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({ where: { slug }, include: { _count: true } });
  if (!category) return null;
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  } satisfies CategorySummary;
}

// ---------------------------------------------------------------------------
// Katalog produk
// ---------------------------------------------------------------------------

function matchesSearch(product: ProductListItem, search: string): boolean {
  if (!search) return true;
  const haystack = `${product.name} ${product.shortDescription ?? ''} ${product.category.name}`.toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function sortProducts(items: ProductListItem[], sort: CatalogQuery['sort']): ProductListItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.finalPrice - b.finalPrice || a.name.localeCompare(b.name));
    case 'price-desc':
      return sorted.sort((a, b) => b.finalPrice - a.finalPrice || a.name.localeCompare(b.name));
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    case 'popular':
    default:
      return sorted.sort(
        (a, b) =>
          Number(b.isBestSeller) - Number(a.isBestSeller) ||
          b.soldCount - a.soldCount ||
          a.name.localeCompare(b.name, 'id'),
      );
  }
}

export async function listProducts(query: CatalogQuery): Promise<ProductListResponse> {
  const where: Prisma.ProductWhereInput = { isPublished: true };
  if (query.category) where.category = { slug: query.category, isActive: true };
  if (query.bestSeller) where.isBestSeller = true;
  if (query.newArrival) where.isNewArrival = true;
  if (query.promo) where.isPromo = true;
  if (query.inStock) where.stock = { gt: 0 };

  const rows = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    take: CATALOG_FETCH_LIMIT,
  });

  let items = rows.map(toProductListItem).filter((product) => matchesSearch(product, query.search));

  if (typeof query.minPrice === 'number') {
    items = items.filter((product) => product.finalPrice >= (query.minPrice as number));
  }
  if (typeof query.maxPrice === 'number') {
    items = items.filter((product) => product.finalPrice <= (query.maxPrice as number));
  }

  items = sortProducts(items, query.sort);

  const total = items.length;
  const perPage = query.perPage || CATALOG_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    page,
    perPage,
    totalPages,
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, isAvailable: true },
    include: productInclude,
    orderBy: [{ isBestSeller: 'desc' }, { soldCount: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
  return rows.map(toProductListItem);
}

export async function getPromoProducts(limit = 12): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, isPromo: true, discountPrice: { not: null } },
    include: productInclude,
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
  return rows.map(toProductListItem);
}

export async function getNewArrivals(limit = 4): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: { isPublished: true },
    include: productInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toProductListItem);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  if (!product || !product.isPublished) return null;
  return toProductDetail(product);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, categoryId, id: { not: productId } },
    include: productInclude,
    orderBy: { soldCount: 'desc' },
    take: limit,
  });
  if (rows.length >= limit) return rows.map(toProductListItem);

  const fallback = await prisma.product.findMany({
    where: { isPublished: true, id: { not: productId }, categoryId: { not: categoryId } },
    include: productInclude,
    orderBy: { soldCount: 'desc' },
    take: limit - rows.length,
  });
  return [...rows, ...fallback].map(toProductListItem);
}

/** Rentang harga untuk filter di halaman katalog. */
export async function getCatalogPriceRange() {
  const rows = await prisma.product.findMany({
    where: { isPublished: true },
    select: { price: true, discountPrice: true },
  });
  if (rows.length === 0) return { min: 0, max: 100000 };
  const prices = rows.map((row) => row.discountPrice ?? row.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export async function getProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });
}

// ---------------------------------------------------------------------------
// Artikel
// ---------------------------------------------------------------------------

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  status: string;
  publishedAt: Date | null;
  updatedAt: Date;
};

function toArticleListItem(article: ArticleRow): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    category: article.category,
    status: article.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    updatedAt: article.updatedAt.toISOString(),
  };
}

export async function listPublishedArticles(options: {
  search?: string;
  category?: string;
  limit?: number;
} = {}): Promise<ArticleListItem[]> {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      ...(options.category ? { category: options.category } : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: options.limit ?? 50,
  });

  const items = articles.map(toArticleListItem);
  if (!options.search) return items;
  const search = options.search.toLowerCase();
  return items.filter((article) =>
    `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(search),
  );
}

export async function getPublishedArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.status !== 'PUBLISHED') return null;
  return { ...toArticleListItem(article), content: article.content };
}

export async function getRelatedArticles(slug: string, limit = 3): Promise<ArticleListItem[]> {
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED', slug: { not: slug } },
    orderBy: [{ publishedAt: 'desc' }],
    take: limit,
  });
  return articles.map(toArticleListItem);
}

export async function getArticleSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });
}

// ---------------------------------------------------------------------------
// Testimoni
// ---------------------------------------------------------------------------

export async function getVisibleTestimonials(limit = 6): Promise<TestimonialView[]> {
  const testimonials = await prisma.testimonial.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: limit,
  });
  return testimonials.map((testimonial) => ({
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    rating: testimonial.rating,
    content: testimonial.content,
    photo: testimonial.photo,
    isVisible: testimonial.isVisible,
    isDemoData: testimonial.isDemoData,
    sortOrder: testimonial.sortOrder,
  }));
}
