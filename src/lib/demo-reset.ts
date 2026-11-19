/**
 * Data demo Dimsum Kita — satu sumber kebenaran yang dipakai oleh:
 *
 * - `prisma/seed.ts` (seed penuh, `wipe: true`), dan
 * - tombol "Reset data demo" pada dashboard admin (`wipe: false`).
 *
 * Mode `wipe: false` (reset dari dashboard) SENGAJA bersifat tidak merusak:
 * hanya pesanan & testimoni berlabel data demo yang dihapus, lalu katalog,
 * artikel, dan testimoni demo dikembalikan ke nilai awal. Pengaturan toko,
 * akun admin beserta passwordnya, dan pesanan asli pelanggan tidak diubah.
 */
import { prisma } from './prisma';
import { hashPassword } from './password';
import { seedCategories, seedProducts } from '../../prisma/seed-data';
import { seedArticles, seedTestimonials } from '../../prisma/seed-content';
import { DEMO_ORDER_NOTE_PREFIX, demoOrders } from '../../prisma/seed-orders';

export const DEMO_RESET_CONFIRMATION = 'RESET DATA DEMO';

const DEMO_DRAFT_ARTICLE = {
  title: 'Menu Dimsum untuk Acara Kantor (Draft)',
  slug: 'menu-dimsum-acara-kantor-draft',
  excerpt:
    'Contoh artikel berstatus draft. Artikel draft tidak boleh tampil di halaman publik dan hanya dapat dilihat administrator.',
  content:
    'Artikel ini adalah contoh berstatus DRAFT.\n\n## Untuk administrator\n\nBuka /admin/articles untuk mengubah status menjadi Published dan artikel akan otomatis tampil di halaman publik.',
  coverImage: '/images/articles/ide-camilan-keluarga.webp',
  category: 'Draft',
};

export type DemoResetResult = {
  categories: number;
  products: number;
  articles: number;
  testimonials: number;
  orders: number;
  mode: 'reset' | 'seed';
};

/** Slug yang konsisten dengan seed lama (normalisasi NFKD lalu tanda hubung). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function orderSettingsCreateData() {
  const brandName = process.env.STORE_BRAND_NAME?.trim() || 'Dimsum Kita';
  return {
    id: 'singleton',
    brandName,
    logo: '/images/logo.svg',
    favicon: '/icon.png',
    description:
      'Menghadirkan aneka dimsum lezat dengan bahan pilihan, cita rasa autentik, dan kualitas yang terjaga. Praktis disajikan untuk keluarga, teman, maupun berbagai acara.',
    // Nomor WhatsApp TIDAK dikarang: hanya diambil dari environment bila diisi.
    whatsappNumber: process.env.STORE_WHATSAPP?.replace(/\D/g, '') || '',
    address: process.env.STORE_ADDRESS?.trim() || '',
    operatingHours: 'Setiap hari, 08.00 - 20.00 WIB (contoh - ubah di dashboard admin)',
    instagram: process.env.STORE_INSTAGRAM?.trim() || '',
    tiktok: process.env.STORE_TIKTOK?.trim() || '',
    email: process.env.STORE_EMAIL?.trim() || '',
    shippingInfo:
      'Pengiriman tersedia untuk area sekitar toko dengan biaya yang dikonfirmasi admin melalui WhatsApp sebelum pesanan diproses.',
    paymentInfo:
      'Pembayaran dikonfirmasi langsung oleh admin melalui WhatsApp (transfer bank atau pembayaran saat pengambilan).',
    shippingCost: 0,
    freeShippingMin: null,
    seoTitle: `${brandName} - Dimsum Lezat, Hangat, dan Bikin Ketagihan`,
    seoDescription:
      'Pesan aneka dimsum pilihan: ayam, udang, premium, mentai, hingga paket keluarga. Praktis dipesan melalui WhatsApp.',
    seoKeywords: 'dimsum, dimsum ayam, dimsum udang, dimsum frozen, paket dimsum, UMKM kuliner',
  };
}

/**
 * Menulis ulang data demo ke database.
 *
 * @param options.wipe  true = kosongkan seluruh tabel katalog/konten/pesanan
 *                      lebih dulu (perilaku seed). false = hanya menyentuh
 *                      data demo.
 * @param options.actor Nama admin yang memicu reset, untuk log aktivitas.
 */
export async function resetDemoData(
  options: { wipe?: boolean; actor?: string } = {},
): Promise<DemoResetResult> {
  const wipe = options.wipe ?? false;
  const actor = options.actor ?? 'Administrator';

  return prisma.$transaction(
    async (tx) => {
      if (wipe) {
        await tx.orderItem.deleteMany();
        await tx.order.deleteMany();
        await tx.activityLog.deleteMany();
        await tx.productImage.deleteMany();
        await tx.productVariant.deleteMany();
        await tx.product.deleteMany();
        await tx.category.deleteMany();
        await tx.article.deleteMany();
        await tx.testimonial.deleteMany();
      } else {
        // Hanya pesanan & testimoni demo yang dihapus.
        await tx.order.deleteMany({ where: { note: { startsWith: DEMO_ORDER_NOTE_PREFIX } } });
        await tx.testimonial.deleteMany({ where: { isDemoData: true } });
      }

      // --- Kategori -----------------------------------------------------------
      const categoryIdBySlug = new Map<string, string>();
      for (const category of seedCategories) {
        const slug = slugify(category.name);
        const record = await tx.category.upsert({
          where: { slug },
          update: {
            name: category.name,
            description: category.description,
            image: category.image,
            sortOrder: category.sortOrder,
            isActive: true,
          },
          create: {
            name: category.name,
            slug,
            description: category.description,
            image: category.image,
            sortOrder: category.sortOrder,
          },
        });
        categoryIdBySlug.set(slug, record.id);
      }

      // --- Produk -------------------------------------------------------------
      const productIdBySlug = new Map<string, string>();
      for (const product of seedProducts) {
        const categoryId = categoryIdBySlug.get(product.categorySlug);
        if (!categoryId) {
          throw new Error(`Kategori "${product.categorySlug}" tidak ada untuk produk ${product.name}`);
        }
        const slug = slugify(product.name);
        const shared = {
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          // Komposisi sengaja dikosongkan: hanya boleh diisi oleh pemilik usaha.
          ingredients: null,
          servingSuggestion: product.servingSuggestion,
          storageSuggestion: product.storageSuggestion ?? null,
          contentLabel: product.contentLabel,
          weightGram: product.weightGram ?? null,
          categoryId,
          price: product.price,
          discountPrice: product.discountPrice ?? null,
          isPromo: Boolean(product.isPromo),
          promoStartsAt: product.isPromo ? new Date() : null,
          promoEndsAt: product.isPromo ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : null,
          image: product.image,
          stock: product.stock,
          isAvailable: product.isAvailable ?? true,
          isBestSeller: Boolean(product.isBestSeller),
          isNewArrival: Boolean(product.isNewArrival),
          isFeatured: Boolean(product.isFeatured),
          isPublished: true,
          soldCount: product.soldCount,
          viewCount: product.viewCount,
          ratingAverage: null,
          ratingCount: 0,
        };

        const record = await tx.product.upsert({
          where: { slug },
          update: shared,
          create: { ...shared, slug },
        });

        // Galeri & varian ditulis ulang agar sama dengan data demo.
        await tx.productImage.deleteMany({ where: { productId: record.id } });
        await tx.productVariant.deleteMany({ where: { productId: record.id } });

        if (product.gallery?.length) {
          await tx.productImage.createMany({
            data: product.gallery.map((url, index) => ({
              productId: record.id,
              url,
              alt: `${product.name} - foto ${index + 2}`,
              sortOrder: index + 1,
            })),
          });
        }

        if (product.variants.length) {
          await tx.productVariant.createMany({
            data: product.variants.map((variant, index) => ({
              productId: record.id,
              name: variant.name,
              priceAdjustment: variant.priceAdjustment ?? 0,
              isDefault: variant.isDefault ?? index === 0,
              sortOrder: index,
            })),
          });
        }

        productIdBySlug.set(slug, record.id);
      }

      // --- Artikel ------------------------------------------------------------
      const now = Date.now();
      for (let i = 0; i < seedArticles.length; i += 1) {
        const article = seedArticles[i]!;
        const publishedAt = new Date(now - (i + 1) * 1000 * 60 * 60 * 24 * 6);
        await tx.article.upsert({
          where: { slug: article.slug },
          update: {
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            coverImage: article.coverImage,
            category: article.category,
            status: 'PUBLISHED',
            publishedAt,
          },
          create: {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            coverImage: article.coverImage,
            category: article.category,
            status: 'PUBLISHED',
            publishedAt,
          },
        });
      }

      await tx.article.upsert({
        where: { slug: DEMO_DRAFT_ARTICLE.slug },
        update: { ...DEMO_DRAFT_ARTICLE, status: 'DRAFT', publishedAt: null },
        create: { ...DEMO_DRAFT_ARTICLE, status: 'DRAFT', publishedAt: null },
      });

      // --- Testimoni (selalu berlabel data demo) ------------------------------
      for (let i = 0; i < seedTestimonials.length; i += 1) {
        const testimonial = seedTestimonials[i]!;
        await tx.testimonial.create({
          data: {
            name: testimonial.name,
            role: testimonial.role,
            rating: testimonial.rating,
            content: testimonial.content,
            isVisible: true,
            isDemoData: true,
            sortOrder: i,
          },
        });
      }

      // --- Pengaturan toko (hanya dibuat bila belum ada) ----------------------
      await tx.storeSettings.upsert({
        where: { id: 'singleton' },
        update: {},
        create: orderSettingsCreateData(),
      });

      // --- Akun admin ---------------------------------------------------------
      const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
      const password = process.env.ADMIN_PASSWORD ?? 'admin';
      await tx.user.upsert({
        where: { username },
        // Saat reset dari dashboard, password yang sudah diubah admin TIDAK direset.
        update: wipe ? { passwordHash: hashPassword(password) } : {},
        create: {
          username,
          name: 'Administrator',
          passwordHash: hashPassword(password),
          role: 'ADMIN',
          isActive: true,
        },
      });

      // --- Pesanan contoh -----------------------------------------------------
      let orderSequence = 1;
      for (const order of demoOrders) {
        const items = order.items.flatMap((item) => {
          const product = seedProducts.find((candidate) => slugify(candidate.name) === item.slug);
          if (!product) return [];
          const unitPrice = product.discountPrice ?? product.price;
          return [
            {
              productName: product.name,
              variantName: item.variantName ?? null,
              image: product.image,
              unitPrice,
              quantity: item.quantity,
              subtotal: unitPrice * item.quantity,
              productId: productIdBySlug.get(item.slug) ?? null,
            },
          ];
        });

        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const createdAt = new Date(now - order.daysAgo * 1000 * 60 * 60 * 24);
        const stamp = `${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}`;
        const orderNumber = `DM-${stamp}-${String(orderSequence).padStart(4, '0')}`;
        orderSequence += 1;

        await tx.order.create({
          data: {
            orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.fulfillment === 'DELIVERY' ? order.address : null,
            fulfillment: order.fulfillment,
            note: `${DEMO_ORDER_NOTE_PREFIX} Pesanan ini dibuat otomatis untuk demonstrasi dashboard.`,
            subtotal,
            shippingCost: 0,
            total: subtotal,
            status: order.status,
            stockCommitted: order.status === 'PROCESSING' || order.status === 'COMPLETED',
            createdAt,
            items: { create: items },
          },
        });
      }

      // --- Log aktivitas ------------------------------------------------------
      await tx.activityLog.createMany({
        data: wipe
          ? [
              {
                actor,
                action: 'SEED',
                entity: 'System',
                description: 'Data demo berhasil dimuat ulang oleh seed.',
                createdAt: new Date(now),
              },
              {
                actor,
                action: 'CREATE',
                entity: 'Product',
                description: `Menambahkan ${seedProducts.length} produk contoh.`,
                createdAt: new Date(now - 1000 * 60 * 5),
              },
              {
                actor,
                action: 'CREATE',
                entity: 'Category',
                description: `Menambahkan ${seedCategories.length} kategori produk.`,
                createdAt: new Date(now - 1000 * 60 * 12),
              },
              {
                actor,
                action: 'CREATE',
                entity: 'Article',
                description: 'Menambahkan artikel panduan dimsum.',
                createdAt: new Date(now - 1000 * 60 * 40),
              },
            ]
          : [
              {
                actor,
                action: 'RESET',
                entity: 'System',
                description:
                  'Reset data demo dari dashboard admin: katalog, artikel, testimoni demo, dan pesanan demo dipulihkan.',
                createdAt: new Date(now),
              },
            ],
      });

      return {
        categories: seedCategories.length,
        products: seedProducts.length,
        articles: seedArticles.length + 1,
        testimonials: seedTestimonials.length,
        orders: demoOrders.length,
        mode: wipe ? ('seed' as const) : ('reset' as const),
      };
    },
    { timeout: 60_000, maxWait: 15_000 },
  );
}
