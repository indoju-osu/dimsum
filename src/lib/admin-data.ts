/**
 * Lapisan akses data khusus dashboard admin (server-only).
 * Dipakai oleh Server Components /admin/* dan Route Handlers /api/admin/*.
 */
import { prisma } from './prisma';
import type { OrderStatus, Prisma } from '@prisma/client';
import { ADMIN_PAGE_SIZE, LOW_STOCK_THRESHOLD, type OrderStatusValue } from './constants';
import { toOrderView } from './order';
import { toProductListItem } from './database';
import type { AdminProductRow, DashboardStats, OrderListResponse } from '../types';

export type AdminProductQuery = {
  search: string;
  categoryId: string;
  status: 'all' | 'published' | 'draft';
  stockStatus: 'all' | 'available' | 'low' | 'out';
  page: number;
};

export type AdminProductListResponse = {
  items: AdminProductRow[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
};

const ADMIN_FETCH_LIMIT = 1000;

export async function listAdminProducts(
  query: AdminProductQuery,
): Promise<AdminProductListResponse> {
  const where = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.status === 'published' ? { isPublished: true } : {}),
    ...(query.status === 'draft' ? { isPublished: false } : {}),
    ...(query.stockStatus === 'low' ? { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } : {}),
    ...(query.stockStatus === 'out' ? { stock: { lte: 0 } } : {}),
    ...(query.stockStatus === 'available' ? { stock: { gt: LOW_STOCK_THRESHOLD } } : {}),
  };

  const rows = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { variants: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: ADMIN_FETCH_LIMIT,
  });

  const search = query.search.toLowerCase();
  const items = rows
    .filter((row) =>
      search
        ? `${row.name} ${row.shortDescription ?? ''} ${row.category.name}`.toLowerCase().includes(search)
        : true,
    )
    .map<AdminProductRow>((row) => ({
      ...toProductListItem(row),
      isPublished: row.isPublished,
      isFeatured: row.isFeatured,
      variantCount: row._count.variants,
      updatedAt: row.updatedAt.toISOString(),
    }));

  const total = items.length;
  const perPage = ADMIN_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * perPage;

  return { items: items.slice(start, start + perPage), total, page, totalPages, perPage };
}

export type AdminOrderQuery = {
  search: string;
  status: 'all' | OrderStatusValue;
  page: number;
  perPage?: number;
};

export async function listOrders(query: AdminOrderQuery): Promise<OrderListResponse> {
  const where: Prisma.OrderWhereInput =
    query.status !== 'all' ? { status: query.status as OrderStatus } : {};
  const rows = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: ADMIN_FETCH_LIMIT,
  });

  const search = query.search.toLowerCase();
  const items = rows
    .filter((row) =>
      search
        ? `${row.orderNumber} ${row.customerName} ${row.customerPhone}`.toLowerCase().includes(search)
        : true,
    )
    .map(toOrderView);

  const perPage = query.perPage ?? ADMIN_PAGE_SIZE;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * perPage;

  return { items: items.slice(start, start + perPage), total, page, perPage, totalPages };
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  return order ? toOrderView(order) : null;
}

export async function listAdminArticles(): Promise<
  {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    category: string;
    status: 'DRAFT' | 'PUBLISHED';
    publishedAt: string | null;
    updatedAt: string;
  }[]
> {
  const articles = await prisma.article.findMany({ orderBy: [{ updatedAt: 'desc' }] });
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    category: article.category,
    status: article.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    updatedAt: article.updatedAt.toISOString(),
  }));
}

export async function listAdminTestimonials() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
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

// ---------------------------------------------------------------------------
// Statistik dashboard
// ---------------------------------------------------------------------------

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = startOfToday();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    revenueTotal,
    revenueThisMonth,
    statusGroups,
    productCount,
    publishedProductCount,
    categoryCount,
    articleCount,
    draftArticleCount,
    testimonialCount,
    ratingAggregate,
    bestSellers,
    lowStockProducts,
    recentOrders,
    weekOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfMonth } },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.category.count(),
    prisma.article.count(),
    prisma.article.count({ where: { status: 'DRAFT' } }),
    prisma.testimonial.count(),
    prisma.testimonial.aggregate({ _avg: { rating: true }, where: { isVisible: true } }),
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { soldCount: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, soldCount: true, stock: true },
    }),
    prisma.product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: 'asc' },
      take: 6,
      select: { id: true, name: true, stock: true },
    }),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
    }),
  ]);

  const statusCount = (status: string) =>
    statusGroups.find((group) => group.status === status)?._count._all ?? 0;

  const salesByDay: DashboardStats['salesByDay'] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const dayOrders = weekOrders.filter(
      (order) => order.createdAt >= day && order.createdAt < nextDay,
    );
    salesByDay.push({
      date: day.toISOString(),
      total: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    });
  }

  return {
    revenueTotal: revenueTotal._sum.total ?? 0,
    revenueThisMonth: revenueThisMonth._sum.total ?? 0,
    orderCount: statusGroups.reduce((sum, group) => sum + group._count._all, 0),
    pendingOrderCount: statusCount('PENDING_CONFIRMATION'),
    completedOrderCount: statusCount('COMPLETED'),
    productCount,
    publishedProductCount,
    lowStockCount: lowStockProducts.filter((product) => product.stock > 0).length,
    outOfStockCount: lowStockProducts.filter((product) => product.stock <= 0).length,
    categoryCount,
    articleCount,
    draftArticleCount,
    testimonialCount,
    averageRating: ratingAggregate._avg.rating ?? null,
    bestSellers,
    lowStockProducts,
    recentOrders: recentOrders.map(toOrderView),
    salesByDay,
  };
}
