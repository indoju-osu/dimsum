/**
 * Skema validasi Zod — dipakai di SERVER untuk semua input yang mengubah data.
 * Validasi di client hanya untuk pengalaman pengguna; keputusan akhir selalu
 * diambil dari hasil parse di server.
 */
import { z } from 'zod';
import { CATALOG_MAX_PAGE_SIZE, CATALOG_PAGE_SIZE, ORDER_STATUS_VALUES } from './constants';
import { isSafeImageSource, sanitizeText } from './sanitization';

const trimmedString = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .transform((value) => sanitizeText(value, { maxLength: max }))
    .refine((value) => value.length >= min, {
      message: `${label} minimal ${min} karakter`,
    })
    .refine((value) => value.length <= max, { message: `${label} maksimal ${max} karakter` });

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) =>
      value === null || value === undefined || value.trim() === ''
        ? null
        : sanitizeText(value, { maxLength: max, multiline: true }),
    );

const multiLineText = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .transform((value) => sanitizeText(value, { maxLength: max, multiline: true }))
    .refine((value) => value.length >= min, { message: `${label} minimal ${min} karakter` });

const imageSource = z
  .string({ required_error: 'Foto wajib diisi' })
  .transform((value) => value.trim())
  .refine((value) => value.length <= 500, { message: 'Path foto maksimal 500 karakter' })
  .refine(isSafeImageSource, {
    message: 'Sumber foto harus berupa path lokal (/images/...) atau URL https',
  });

const slugField = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .refine((value) => value === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
    message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung',
  })
  .refine((value) => value.length <= 80, { message: 'Slug maksimal 80 karakter' });

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  username: z
    .string({ required_error: 'Username wajib diisi' })
    .transform((value) => value.trim())
    .refine((value) => value.length >= 3 && value.length <= 60, {
      message: 'Username minimal 3 karakter',
    }),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(1, 'Password wajib diisi')
    .max(200, 'Password terlalu panjang'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Produk
// ---------------------------------------------------------------------------

export const productVariantInputSchema = z.object({
  id: z.string().optional(),
  name: trimmedString(1, 60, 'Nama varian'),
  priceAdjustment: z.coerce
    .number({ invalid_type_error: 'Selisih harga harus angka' })
    .int('Selisih harga harus bilangan bulat')
    .min(-1_000_000, 'Selisih harga tidak wajar')
    .max(1_000_000, 'Selisih harga tidak wajar')
    .default(0),
  isDefault: z.coerce.boolean().default(false),
});

export const productInputSchema = z
  .object({
    name: trimmedString(2, 120, 'Nama produk'),
    slug: slugField.optional(),
    shortDescription: optionalText(200),
    description: multiLineText(10, 4000, 'Deskripsi produk'),
    ingredients: optionalText(1000),
    servingSuggestion: optionalText(600),
    storageSuggestion: optionalText(600),
    contentLabel: trimmedString(1, 40, 'Isi kemasan'),
    weightGram: z
      .union([z.coerce.number().int().min(0).max(100000), z.literal(''), z.null(), z.undefined()])
      .transform((value) => (value === '' || value === null || value === undefined ? null : value)),
    categoryId: z.string({ required_error: 'Kategori wajib dipilih' }).min(1, 'Kategori wajib dipilih'),
    price: z.coerce
      .number({ invalid_type_error: 'Harga harus berupa angka' })
      .int('Harga harus bilangan bulat (Rupiah)')
      .positive('Harga harus lebih dari 0')
      .max(1_000_000_000, 'Harga terlalu besar'),
    discountPrice: z
      .union([z.coerce.number().int().min(0).max(1_000_000_000), z.literal(''), z.null(), z.undefined()])
      .transform((value) =>
        value === '' || value === null || value === undefined || value === 0 ? null : value,
      ),
    isPromo: z.coerce.boolean().default(false),
    promoEndsAt: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => (value ? value : null))
      .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), {
        message: 'Tanggal berakhir promo tidak valid',
      }),
    image: imageSource,
    gallery: z.array(imageSource).max(6, 'Maksimal 6 foto galeri').default([]),
    stock: z.coerce
      .number({ invalid_type_error: 'Stok harus berupa angka' })
      .int('Stok harus bilangan bulat')
      .min(0, 'Stok tidak boleh negatif')
      .max(1_000_000, 'Stok terlalu besar'),
    isAvailable: z.coerce.boolean().default(true),
    isBestSeller: z.coerce.boolean().default(false),
    isNewArrival: z.coerce.boolean().default(false),
    isFeatured: z.coerce.boolean().default(false),
    isPublished: z.coerce.boolean().default(true),
    variants: z.array(productVariantInputSchema).max(10, 'Maksimal 10 varian').default([]),
  })
  .refine((data) => data.discountPrice === null || data.discountPrice < data.price, {
    message: 'Harga diskon harus lebih kecil dari harga normal',
    path: ['discountPrice'],
  })
  .refine((data) => !data.isPromo || data.discountPrice !== null, {
    message: 'Produk promo harus memiliki harga diskon',
    path: ['discountPrice'],
  })
  .refine(
    (data) =>
      data.variants.every((variant) => {
        const finalPrice = data.price - (data.discountPrice ? data.price - data.discountPrice : 0);
        return finalPrice + variant.priceAdjustment > 0;
      }),
    { message: 'Harga varian tidak boleh nol atau negatif', path: ['variants'] },
  );

export type ProductInput = z.infer<typeof productInputSchema>;

export const stockUpdateSchema = z.object({
  stock: z.coerce
    .number({ invalid_type_error: 'Stok harus berupa angka' })
    .int('Stok harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif')
    .max(1_000_000, 'Stok terlalu besar'),
});

// ---------------------------------------------------------------------------
// Kategori
// ---------------------------------------------------------------------------

export const categoryInputSchema = z.object({
  name: trimmedString(2, 60, 'Nama kategori'),
  slug: slugField.optional(),
  description: optionalText(500),
  image: z.union([imageSource, z.literal(''), z.null(), z.undefined()]).transform((value) =>
    value === '' || value === null || value === undefined ? null : value,
  ),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

// ---------------------------------------------------------------------------
// Artikel
// ---------------------------------------------------------------------------

export const articleInputSchema = z.object({
  title: trimmedString(3, 160, 'Judul artikel'),
  slug: slugField.optional(),
  excerpt: multiLineText(10, 400, 'Ringkasan'),
  content: multiLineText(20, 20000, 'Konten artikel'),
  coverImage: z.union([imageSource, z.literal(''), z.null(), z.undefined()]).transform((value) =>
    value === '' || value === null || value === undefined ? null : value,
  ),
  category: trimmedString(2, 60, 'Kategori artikel').default('Tips'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

// ---------------------------------------------------------------------------
// Testimoni
// ---------------------------------------------------------------------------

export const testimonialInputSchema = z.object({
  name: trimmedString(2, 80, 'Nama pelanggan'),
  role: optionalText(80),
  rating: z.coerce
    .number({ invalid_type_error: 'Rating harus angka' })
    .int('Rating harus bilangan bulat')
    .min(1, 'Rating minimal 1')
    .max(5, 'Rating maksimal 5'),
  content: multiLineText(10, 600, 'Isi ulasan'),
  photo: z.union([imageSource, z.literal(''), z.null(), z.undefined()]).transform((value) =>
    value === '' || value === null || value === undefined ? null : value,
  ),
  isVisible: z.coerce.boolean().default(true),
  isDemoData: z.coerce.boolean().default(false),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

// ---------------------------------------------------------------------------
// Pengaturan toko
// ---------------------------------------------------------------------------

const optionalUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value ? value.trim() : ''))
  .refine((value) => value === '' || /^https?:\/\//i.test(value), {
    message: 'URL harus diawali http:// atau https://',
  });

export const settingsInputSchema = z.object({
  brandName: trimmedString(2, 80, 'Nama brand'),
  logo: z.union([imageSource, z.literal(''), z.null(), z.undefined()]).transform((value) =>
    value === '' || value === null || value === undefined ? null : value,
  ),
  favicon: z.union([imageSource, z.literal(''), z.null(), z.undefined()]).transform((value) =>
    value === '' || value === null || value === undefined ? null : value,
  ),
  description: multiLineText(10, 600, 'Deskripsi toko'),
  whatsappNumber: z
    .string()
    .transform((value) => value.replace(/[^\d]/g, ''))
    .refine((value) => value === '' || (value.length >= 9 && value.length <= 15), {
      message: 'Nomor WhatsApp harus 9-15 digit angka (format internasional, contoh 6281...)',
    }),
  address: optionalText(300),
  operatingHours: optionalText(200),
  instagram: optionalUrl,
  tiktok: optionalUrl,
  email: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ? value.trim() : ''))
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Format email tidak valid',
    }),
  shippingInfo: optionalText(1000),
  paymentInfo: optionalText(1000),
  shippingCost: z.coerce
    .number({ invalid_type_error: 'Ongkos kirim harus angka' })
    .int('Ongkos kirim harus bilangan bulat')
    .min(0, 'Ongkos kirim tidak boleh negatif')
    .max(10_000_000, 'Ongkos kirim terlalu besar'),
  freeShippingMin: z
    .union([z.coerce.number().int().min(0).max(100_000_000), z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value === '' || value === null || value === undefined ? null : value)),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  seoKeywords: optionalText(300),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

// ---------------------------------------------------------------------------
// Keranjang & pesanan
// ---------------------------------------------------------------------------

export const cartItemSchema = z.object({
  productId: z.string().min(1, 'ID produk tidak valid').max(60),
  variantId: z.string().max(60).optional().nullable(),
  quantity: z.coerce
    .number()
    .int('Jumlah harus bilangan bulat')
    .min(1, 'Jumlah minimal 1')
    .max(99, 'Jumlah maksimal 99 per produk'),
  /**
   * Harga yang sedang ditampilkan di browser. HANYA dipakai untuk mendeteksi
   * perubahan harga agar pengguna diberi tahu — tidak pernah dipakai menghitung
   * total. Harga final selalu diambil dari database.
   */
  expectedUnitPrice: z.coerce.number().min(0).max(1_000_000_000).optional(),
});

export const cartValidationSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Keranjang masih kosong').max(50, 'Terlalu banyak item'),
});

export type CartValidationInput = z.infer<typeof cartValidationSchema>;

export const orderInputSchema = z
  .object({
    customerName: trimmedString(2, 100, 'Nama lengkap'),
    customerPhone: z
      .string({ required_error: 'Nomor WhatsApp wajib diisi' })
      .transform((value) => value.replace(/[^\d+]/g, ''))
      .refine((value) => /^(\+?62|0)\d{8,13}$/.test(value), {
        message: 'Nomor WhatsApp tidak valid (contoh: 08123456789)',
      }),
    fulfillment: z.enum(['PICKUP', 'DELIVERY'], {
      errorMap: () => ({ message: 'Pilih metode pengambilan' }),
    }),
    address: optionalText(300),
    note: optionalText(500),
    items: z.array(cartItemSchema).min(1, 'Keranjang masih kosong').max(50, 'Terlalu banyak item'),
  })
  .refine((data) => data.fulfillment !== 'DELIVERY' || (data.address?.length ?? 0) >= 10, {
    message: 'Alamat lengkap wajib diisi untuk metode pengiriman',
    path: ['address'],
  });

export type OrderInput = z.infer<typeof orderInputSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
});

// ---------------------------------------------------------------------------
// Query katalog
// ---------------------------------------------------------------------------

export const catalogQuerySchema = z.object({
  search: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ? sanitizeText(value, { maxLength: 80 }) : '')),
  category: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ? value.trim().slice(0, 80) : '')),
  minPrice: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  bestSeller: z.coerce.boolean().default(false),
  promo: z.coerce.boolean().default(false),
  newArrival: z.coerce.boolean().default(false),
  inStock: z.coerce.boolean().default(false),
  sort: z.enum(['popular', 'newest', 'price-asc', 'price-desc', 'name-asc']).default('popular'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(CATALOG_MAX_PAGE_SIZE).default(CATALOG_PAGE_SIZE),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export const adminProductQuerySchema = z.object({
  search: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ? sanitizeText(value, { maxLength: 80 }) : '')),
  categoryId: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ? value.trim().slice(0, 60) : '')),
  status: z.enum(['all', 'published', 'draft']).default('all'),
  stockStatus: z.enum(['all', 'available', 'low', 'out']).default('all'),
  page: z.coerce.number().int().min(1).max(500).default(1),
});
