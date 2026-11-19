/**
 * Logika pesanan (server-only).
 *
 * Aturan penting:
 * - Harga, ketersediaan, dan stok SELALU diambil ulang dari database. Nilai yang
 *   dikirim browser hanya dipakai untuk perbandingan (memberi tahu perubahan).
 * - Stok TIDAK dikurangi saat pelanggan memesan. Stok dipotong secara atomik
 *   ketika admin mengubah status menjadi DIPROSES (PROCESSING), sehingga
 *   pesanan palsu tidak dapat menghabiskan stok.
 * - Bila pesanan dibatalkan (CANCELLED) setelah stok terpotong, stok dan jumlah
 *   terjual dikembalikan.
 */
import { CART_NOTICE_MESSAGE, clampCartQuantity } from './cart';
import { prisma } from './prisma';
import type { OrderStatusValue } from './constants';
import type {
  CartNotice,
  CartPricing,
  OrderView,
  ValidatedCartLine,
} from '../types';
import type { OrderInput } from './validation';

export class OrderError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'OrderError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Revalidasi keranjang di server
// ---------------------------------------------------------------------------

export type CartRevalidation = {
  items: ValidatedCartLine[];
  pricing: CartPricing;
  notice: CartNotice;
};

export type CartRequestItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  expectedUnitPrice?: number;
};

export function emptyNotice(): CartNotice {
  return {
    priceUpdated: false,
    stockAdjusted: false,
    removed: false,
    removedNames: [],
    adjustedNames: [],
    priceChangedNames: [],
  };
}

/**
 * Bandingkan keranjang pelanggan dengan kondisi database saat ini.
 * Baris yang produknya tidak ada / tidak dipublikasikan / habis akan dibuang.
 */
export async function revalidateCart(items: CartRequestItem[]): Promise<CartRevalidation> {
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true },
      })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  const validated: ValidatedCartLine[] = [];
  const notice = emptyNotice();

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product || !product.isPublished || !product.isAvailable) {
      notice.removed = true;
      if (product) notice.removedNames.push(product.name);
      continue;
    }

    const basePrice = product.discountPrice ?? product.price;
    let variant = item.variantId
      ? product.variants.find((candidate) => candidate.id === item.variantId)
      : product.variants.find((candidate) => candidate.isDefault);
    variant = variant ?? product.variants[0] ?? undefined;

    const unitPrice = basePrice + (variant?.priceAdjustment ?? 0);
    if (unitPrice <= 0) {
      notice.removed = true;
      notice.removedNames.push(product.name);
      continue;
    }

    if (product.stock <= 0) {
      notice.removed = true;
      notice.removedNames.push(product.name);
      continue;
    }

    const requestedQuantity = clampCartQuantity(item.quantity);
    let quantity = requestedQuantity;
    let stockAdjusted = false;
    if (quantity > product.stock) {
      quantity = product.stock;
      stockAdjusted = true;
      notice.stockAdjusted = true;
      notice.adjustedNames.push(product.name);
    }

    let priceChanged = false;
    if (
      typeof item.expectedUnitPrice === 'number' &&
      Number.isFinite(item.expectedUnitPrice) &&
      item.expectedUnitPrice !== unitPrice
    ) {
      priceChanged = true;
      notice.priceUpdated = true;
      notice.priceChangedNames.push(product.name);
    }

    validated.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      unitPrice,
      requestedQuantity,
      quantity,
      stock: product.stock,
      isAvailable: true,
      priceChanged,
      stockAdjusted,
    });
  }

  const pricing: CartPricing = validated.reduce<CartPricing>(
    (accumulator, line) => ({
      subtotal: accumulator.subtotal + line.unitPrice * line.quantity,
      totalQuantity: accumulator.totalQuantity + line.quantity,
      totalItems: accumulator.totalItems + 1,
    }),
    { subtotal: 0, totalQuantity: 0, totalItems: 0 },
  );

  return { items: validated, pricing, notice };
}

// ---------------------------------------------------------------------------
// Nomor pesanan
// ---------------------------------------------------------------------------

function formatDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Nomor pesanan berurutan per hari: DM-YYYYMMDD-0001.
 * Pencarian kandidat bebas bentrok dilakukan di dalam transaksi; indeks unik
 * pada kolom orderNumber menjadi jaring pengaman terakhir.
 */
async function nextOrderNumber(client: TransactionClient, now = new Date()): Promise<string> {
  const stamp = formatDateStamp(now);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const todayCount = await client.order.count({
    where: { createdAt: { gte: startOfDay, lt: startOfNextDay } },
  });

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = `DM-${stamp}-${String(todayCount + 1 + attempt).padStart(4, '0')}`;
    const existing = await client.order.findUnique({ where: { orderNumber: candidate } });
    if (!existing) return candidate;
  }
  return `DM-${stamp}-${String(Date.now()).slice(-5)}`;
}

// ---------------------------------------------------------------------------
// Normalisasi nomor telepon
// ---------------------------------------------------------------------------

/** 0812... -> 62812... (format internasional untuk wa.me). */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

// ---------------------------------------------------------------------------
// Membuat pesanan
// ---------------------------------------------------------------------------

export type CreateOrderResult = {
  order: OrderView;
  notice: CartNotice;
  priceUpdateNote: string | null;
  stockAdjustNote: string | null;
  removedNote: string | null;
};

export type CreateOrderOptions = {
  shippingCost: number;
  freeShippingMin: number | null;
};

export async function createOrder(
  input: OrderInput,
  options: CreateOrderOptions,
): Promise<CreateOrderResult> {
  const revalidation = await revalidateCart(input.items);

  if (revalidation.items.length === 0) {
    throw new OrderError(
      'Keranjang tidak berisi produk yang masih tersedia. Silakan pilih produk lain.',
      409,
    );
  }

  const subtotal = revalidation.pricing.subtotal;
  let shippingCost = 0;
  if (input.fulfillment === 'DELIVERY') {
    const freeShipping =
      options.freeShippingMin !== null && subtotal >= options.freeShippingMin;
    shippingCost = freeShipping ? 0 : Math.max(0, options.shippingCost);
  }
  const total = subtotal + shippingCost;
  const normalizedPhone = normalizePhoneForWhatsApp(input.customerPhone);
  const address = input.fulfillment === 'DELIVERY' ? (input.address ?? null) : null;

  const order = await prisma.$transaction(async (client) => {
    const orderNumber = await nextOrderNumber(client);
    return client.order.create({
      data: {
        orderNumber,
        customerName: input.customerName,
        customerPhone: normalizedPhone,
        address,
        fulfillment: input.fulfillment,
        note: input.note ?? null,
        subtotal,
        shippingCost,
        total,
        status: 'PENDING_CONFIRMATION',
        stockCommitted: false,
        items: {
          create: revalidation.items.map((line) => ({
            productId: line.productId,
            productName: line.name,
            variantName: line.variantName,
            image: line.image,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            subtotal: line.unitPrice * line.quantity,
          })),
        },
      },
      include: { items: true },
    });
  });

  const { notice } = revalidation;
  const priceUpdateNote = notice.priceUpdated ? CART_NOTICE_MESSAGE.priceUpdated : null;

  let stockAdjustNote: string | null = null;
  if (notice.stockAdjusted) {
    const uniqueNames = Array.from(new Set(notice.adjustedNames));
    stockAdjustNote = uniqueNames.length
      ? `${CART_NOTICE_MESSAGE.stockAdjusted} Disesuaikan: ${uniqueNames.join(', ')}.`
      : CART_NOTICE_MESSAGE.stockAdjusted;
  }

  let removedNote: string | null = null;
  if (notice.removed) {
    const uniqueNames = Array.from(new Set(notice.removedNames));
    removedNote = uniqueNames.length
      ? `${CART_NOTICE_MESSAGE.removed} Produk: ${uniqueNames.join(', ')}.`
      : CART_NOTICE_MESSAGE.removed;
  }

  return {
    order: toOrderView(order),
    notice,
    priceUpdateNote,
    stockAdjustNote,
    removedNote,
  };
}

// ---------------------------------------------------------------------------
// Perubahan status + pemotongan stok atomik
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatusValue,
): Promise<OrderView> {
  const order = await prisma.$transaction(async (client) => {
    const current = await client.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!current) throw new OrderError('Pesanan tidak ditemukan.', 404);
    if (current.status === nextStatus) return current;

    let stockCommitted = current.stockCommitted;

    // Potong stok saat pesanan mulai diproses.
    if (nextStatus === 'PROCESSING' && !current.stockCommitted) {
      for (const item of current.items) {
        if (!item.productId) continue;
        const updated = await client.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
        });
        if (updated.count === 0) {
          throw new OrderError(
            `Stok "${item.productName}" tidak mencukupi untuk memproses pesanan ini. Perbarui stok produk terlebih dahulu.`,
            409,
          );
        }
      }
      stockCommitted = true;
    }

    // Kembalikan stok bila pesanan dibatalkan setelah dipotong.
    if (nextStatus === 'CANCELLED' && current.stockCommitted) {
      for (const item of current.items) {
        if (!item.productId) continue;
        await client.product.updateMany({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
      }
      stockCommitted = false;
    }

    if (nextStatus === 'COMPLETED') stockCommitted = true;

    return client.order.update({
      where: { id: orderId },
      data: { status: nextStatus, stockCommitted },
      include: { items: true },
    });
  });

  return toOrderView(order);
}

// ---------------------------------------------------------------------------
// Pemetaan ke DTO
// ---------------------------------------------------------------------------

type OrderWithItems = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string | null;
  fulfillment: string;
  note: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  stockCommitted: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string | null;
    productName: string;
    variantName: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
};

export function toOrderView(order: OrderWithItems): OrderView {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    fulfillment: order.fulfillment === 'DELIVERY' ? 'DELIVERY' : 'PICKUP',
    note: order.note,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    total: order.total,
    status: order.status as OrderStatusValue,
    stockCommitted: order.stockCommitted,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName,
      image: item.image,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
