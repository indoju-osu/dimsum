/**
 * Data seed: kategori & produk.
 * Dipisahkan dari seed.ts agar mudah dibaca dan diedit.
 */

export type SeedCategory = {
  name: string;
  description: string;
  image: string;
  sortOrder: number;
};

export type SeedVariant = { name: string; priceAdjustment?: number; isDefault?: boolean };

export type SeedProduct = {
  name: string;
  categorySlug: string;
  price: number;
  discountPrice?: number;
  contentLabel: string;
  weightGram?: number;
  shortDescription: string;
  description: string;
  image: string;
  stock: number;
  isBestSeller?: boolean;
  isPromo?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
  soldCount: number;
  viewCount: number;
  servingSuggestion: string;
  storageSuggestion?: string;
  variants: SeedVariant[];
  gallery?: string[];
};

export const seedCategories: SeedCategory[] = [
  {
    name: 'Dimsum Ayam',
    description: 'Dimsum berbahan dasar ayam dengan tekstur lembut dan rasa gurih.',
    image: '/images/categories/dimsum-ayam.webp',
    sortOrder: 1,
  },
  {
    name: 'Dimsum Udang',
    description: 'Dimsum udang dengan sensasi kenyal dan rasa manis alami.',
    image: '/images/categories/dimsum-udang.webp',
    sortOrder: 2,
  },
  {
    name: 'Dimsum Premium',
    description: 'Pilihan dimsum dengan isian lebih melimpah dan varian spesial.',
    image: '/images/categories/dimsum-premium.webp',
    sortOrder: 3,
  },
  {
    name: 'Dimsum Mentai',
    description: 'Dimsum dengan saus mentai creamy yang dipanggang hingga harum.',
    image: '/images/categories/dimsum-mentai.webp',
    sortOrder: 4,
  },
  {
    name: 'Dimsum Frozen',
    description: 'Dimsum siap kukus yang disimpan beku agar tahan lebih lama.',
    image: '/images/categories/dimsum-frozen.webp',
    sortOrder: 5,
  },
  {
    name: 'Paket Hemat',
    description: 'Kombinasi dimsum berisi banyak dengan harga lebih ramah.',
    image: '/images/categories/paket-hemat.webp',
    sortOrder: 6,
  },
  {
    name: 'Paket Keluarga',
    description: 'Porsi besar untuk dinikmati bersama keluarga atau acara.',
    image: '/images/categories/paket-keluarga.webp',
    sortOrder: 7,
  },
  {
    name: 'Saus dan Pelengkap',
    description: 'Saus dan pelengkap untuk melengkapi sajian dimsum Anda.',
    image: '/images/categories/saus-pelengkap.webp',
    sortOrder: 8,
  },
];

const steamFry = (fryAdjustment = 2000): SeedVariant[] => [
  { name: 'Kukus', isDefault: true },
  { name: 'Goreng', priceAdjustment: fryAdjustment },
];

export const seedProducts: SeedProduct[] = [
  {
    name: 'Dimsum Ayam Original (5 pcs)',
    categorySlug: 'dimsum-ayam',
    price: 18000,
    contentLabel: '5 pcs',
    weightGram: 150,
    shortDescription: 'Dimsum ayam klasik dengan kulit lembut dan isian ayam gurih.',
    description:
      'Dimsum Ayam Original adalah pilihan paling aman bagi siapa pun yang baru mencoba dimsum kami. Isian ayam diolah hingga bertekstur lembut, padat, dan tetap juicy saat dikukus. Sajikan hangat sebagai camilan sore, teman belajar, atau pendamping makan keluarga.',
    image: '/images/products/dimsum-ayam-original.webp',
    stock: 120,
    isBestSeller: true,
    isFeatured: true,
    soldCount: 486,
    viewCount: 1820,
    servingSuggestion:
      'Kukus 8-10 menit setelah air mendidih, lalu sajikan hangat bersama saus. Hindari mengukus terlalu lama agar kulit dimsum tidak pecah.',
    storageSuggestion:
      'Simpan di lemari pendingin bila dikonsumsi dalam 1-2 hari, atau di freezer untuk penyimpanan lebih lama.',
    variants: steamFry(),
    gallery: ['/images/products/dimsum-ayam-jamur.webp'],
  },
  {
    name: 'Dimsum Ayam Jamur (5 pcs)',
    categorySlug: 'dimsum-ayam',
    price: 20000,
    contentLabel: '5 pcs',
    weightGram: 155,
    shortDescription: 'Perpaduan ayam dan jamur dengan aroma yang lebih kaya.',
    description:
      'Untuk Anda yang menyukai rasa lebih kaya, Dimsum Ayam Jamur menggabungkan isian ayam dengan potongan jamur. Aroma jamur yang khas memberi dimensi rasa berbeda dibanding dimsum ayam biasa, sementara teksturnya tetap lembut dan tidak kering.',
    image: '/images/products/dimsum-ayam-jamur.webp',
    stock: 90,
    isBestSeller: true,
    isFeatured: true,
    soldCount: 341,
    viewCount: 1240,
    servingSuggestion:
      'Kukus 8-10 menit. Aromanya paling terasa bila langsung disajikan setelah matang.',
    storageSuggestion: 'Simpan dingin maksimal 2 hari, atau bekukan untuk penyimpanan lebih lama.',
    variants: steamFry(),
  },
  {
    name: 'Dimsum Udang Premium (5 pcs)',
    categorySlug: 'dimsum-udang',
    price: 25000,
    contentLabel: '5 pcs',
    weightGram: 160,
    shortDescription: 'Dimsum udang dengan tekstur kenyal dan rasa manis alami.',
    description:
      'Dimsum Udang Premium dibuat dengan isian udang yang terasa jelas di setiap gigitan. Teksturnya kenyal dengan rasa manis alami khas udang. Pilihan tepat bila Anda ingin sajian terasa lebih istimewa.',
    image: '/images/products/dimsum-udang-premium.webp',
    stock: 75,
    isBestSeller: true,
    isFeatured: true,
    soldCount: 398,
    viewCount: 1510,
    servingSuggestion:
      'Cukup kukus 7-9 menit. Udang cepat matang, jadi hindari mengukus terlalu lama agar teksturnya tetap kenyal.',
    variants: steamFry(3000),
    gallery: ['/images/products/dimsum-crabstick.webp'],
  },
  {
    name: 'Dimsum Crabstick (5 pcs)',
    categorySlug: 'dimsum-premium',
    price: 22000,
    contentLabel: '5 pcs',
    weightGram: 150,
    shortDescription: 'Dimsum isi crabstick dengan rasa gurih yang lembut.',
    description:
      'Varian untuk Anda yang menyukai rasa laut yang ringan. Dimsum Crabstick memakai isian crabstick yang gurih dan lembut, cocok dipadukan dengan saus manis maupun saus pedas.',
    image: '/images/products/dimsum-crabstick.webp',
    stock: 60,
    isNewArrival: true,
    soldCount: 96,
    viewCount: 620,
    servingSuggestion: 'Kukus 8-10 menit, lalu sajikan bersama saus pilihan Anda.',
    variants: steamFry(),
  },
  {
    name: 'Dimsum Mozzarella (5 pcs)',
    categorySlug: 'dimsum-premium',
    price: 25000,
    discountPrice: 21500,
    contentLabel: '5 pcs',
    weightGram: 170,
    shortDescription: 'Dimsum dengan isian keju mozzarella yang meleleh.',
    description:
      'Perpaduan dimsum gurih dengan keju mozzarella yang meleleh saat disantap. Paling nikmat disajikan hangat agar kejunya masih melar. Menjadi favorit anak-anak maupun pencinta keju.',
    image: '/images/products/dimsum-mozzarella.webp',
    stock: 48,
    isPromo: true,
    isFeatured: true,
    soldCount: 254,
    viewCount: 1130,
    servingSuggestion:
      'Kukus 8-10 menit atau goreng hingga keemasan. Sajikan segera agar keju masih meleleh.',
    variants: steamFry(2500),
  },
  {
    name: 'Dimsum Mentai (5 pcs)',
    categorySlug: 'dimsum-mentai',
    price: 28000,
    contentLabel: '5 pcs',
    weightGram: 180,
    shortDescription: 'Dimsum dengan saus mentai creamy yang dipanggang.',
    description:
      'Dimsum Mentai disiram saus mentai creamy lalu dipanggang hingga permukaannya harum. Kombinasi gurih, creamy, dan sedikit smoky membuat varian ini menjadi salah satu yang paling dicari pelanggan.',
    image: '/images/products/dimsum-mentai.webp',
    stock: 54,
    isBestSeller: true,
    isFeatured: true,
    soldCount: 372,
    viewCount: 1680,
    servingSuggestion:
      'Panaskan 8-10 menit dengan kukusan atau wajan tertutup. Saus mentai paling nikmat saat masih hangat.',
    storageSuggestion: 'Simpan dingin dan panaskan kembali sebelum disajikan.',
    variants: [
      { name: 'Original', isDefault: true },
      { name: 'Extra Saus Mentai', priceAdjustment: 5000 },
    ],
    gallery: ['/images/products/dimsum-mentai.webp'],
  },
  {
    name: 'Dimsum Beef (5 pcs)',
    categorySlug: 'dimsum-premium',
    price: 27000,
    contentLabel: '5 pcs',
    weightGram: 165,
    shortDescription: 'Dimsum isi daging sapi dengan cita rasa yang lebih pekat.',
    description:
      'Dimsum Beef menghadirkan rasa daging sapi yang lebih pekat dan berkarakter. Cocok untuk Anda yang menginginkan sensasi berbeda dari dimsum ayam maupun udang.',
    image: '/images/products/dimsum-beef.webp',
    stock: 42,
    isNewArrival: true,
    soldCount: 88,
    viewCount: 540,
    servingSuggestion: 'Kukus 9-11 menit agar isian matang merata, lalu sajikan hangat.',
    variants: steamFry(2500),
  },
  {
    name: 'Dimsum Nori (5 pcs)',
    categorySlug: 'dimsum-premium',
    price: 23000,
    contentLabel: '5 pcs',
    weightGram: 155,
    shortDescription: 'Dimsum dengan lapisan nori yang memberi aroma khas.',
    description:
      'Dimsum Nori memadukan isian gurih dengan aroma rumput laut yang khas. Aroma nori membuat sajian terasa lebih segar dan tidak membosankan.',
    image: '/images/products/dimsum-nori.webp',
    stock: 66,
    soldCount: 134,
    viewCount: 700,
    servingSuggestion: 'Kukus 8-10 menit. Sajikan dengan saus yang tidak terlalu pekat agar aroma nori tetap terasa.',
    variants: steamFry(),
  },
  {
    name: 'Dimsum Frozen Original (10 pcs)',
    categorySlug: 'dimsum-frozen',
    price: 32000,
    discountPrice: 28500,
    contentLabel: '10 pcs',
    weightGram: 300,
    shortDescription: 'Dimsum ayam original siap kukus, disimpan beku.',
    description:
      'Versi praktis untuk stok di rumah. Dimsum Frozen Original berisi 10 pcs dimsum ayam yang sudah dibekukan sehingga bisa disimpan lebih lama dan dikukus kapan saja Anda ingin menyantapnya.',
    image: '/images/products/dimsum-frozen-original.webp',
    stock: 85,
    isPromo: true,
    isFeatured: true,
    soldCount: 298,
    viewCount: 1420,
    servingSuggestion:
      'Kukus langsung dari kondisi beku selama 12-15 menit tanpa perlu dicairkan terlebih dahulu, sampai bagian dalam terasa panas merata.',
    storageSuggestion:
      'Simpan di freezer pada suhu di bawah -18°C. Hindari mencairkan lalu membekukan ulang.',
    variants: [
      { name: 'Paket 10 pcs', isDefault: true },
      { name: 'Paket 20 pcs', priceAdjustment: 30000 },
    ],
    gallery: ['/images/products/dimsum-frozen-premium.webp'],
  },
  {
    name: 'Dimsum Frozen Premium (20 pcs)',
    categorySlug: 'dimsum-frozen',
    price: 65000,
    contentLabel: '20 pcs',
    weightGram: 620,
    shortDescription: 'Kombinasi dimsum premium dalam kemasan beku 20 pcs.',
    description:
      'Pilihan hemat untuk stok camilan keluarga. Dimsum Frozen Premium berisi 20 pcs kombinasi varian premium dalam kondisi beku, cocok untuk disimpan dan dikukus sewaktu-waktu.',
    image: '/images/products/dimsum-frozen-premium.webp',
    stock: 40,
    isBestSeller: true,
    soldCount: 212,
    viewCount: 1180,
    servingSuggestion:
      'Kukus dari kondisi beku selama 12-15 menit. Pisahkan dimsum agar tidak saling menempel sebelum masuk kukusan.',
    storageSuggestion: 'Simpan di freezer di bawah -18°C. Konsumsi dalam beberapa minggu setelah dibuka.',
    variants: [{ name: 'Paket 20 pcs', isDefault: true }],
  },
  {
    name: 'Paket Dimsum Mix (15 pcs)',
    categorySlug: 'paket-hemat',
    price: 55000,
    discountPrice: 49500,
    contentLabel: '15 pcs',
    weightGram: 460,
    shortDescription: 'Tiga varian dimsum favorit dalam satu paket hemat.',
    description:
      'Paket Dimsum Mix berisi 15 pcs yang terdiri dari beberapa varian favorit sehingga Anda bisa mencoba lebih banyak rasa dalam satu pemesanan. Pilihan praktis untuk berbagi bersama teman atau rekan kerja.',
    image: '/images/products/paket-dimsum-mix.webp',
    stock: 38,
    isPromo: true,
    isFeatured: true,
    soldCount: 268,
    viewCount: 1290,
    servingSuggestion:
      'Kukus seluruh paket selama 10-12 menit, atau pisahkan sesuai porsi yang ingin disantap.',
    variants: [
      { name: 'Kukus', isDefault: true },
      { name: 'Goreng', priceAdjustment: 5000 },
    ],
    gallery: ['/images/products/paket-keluarga.webp'],
  },
  {
    name: 'Paket Keluarga (30 pcs)',
    categorySlug: 'paket-keluarga',
    price: 105000,
    contentLabel: '30 pcs',
    weightGram: 900,
    shortDescription: 'Porsi besar untuk dinikmati bersama keluarga atau acara.',
    description:
      'Paket Keluarga berisi 30 pcs dimsum pilihan yang cukup untuk dinikmati bersama. Cocok untuk makan bersama keluarga, kumpul akhir pekan, arisan, maupun acara sederhana di rumah.',
    image: '/images/products/paket-keluarga.webp',
    stock: 22,
    isBestSeller: true,
    isFeatured: true,
    soldCount: 184,
    viewCount: 1610,
    servingSuggestion:
      'Kukus bertahap dalam beberapa batch agar semua dimsum tersaji dalam kondisi hangat. Perkirakan 10-12 menit per batch.',
    storageSuggestion: 'Bila tidak langsung dihabiskan, simpan sisa di lemari pendingin dan panaskan kembali sebelum disajikan.',
    variants: [
      { name: 'Kukus', isDefault: true },
      { name: 'Goreng', priceAdjustment: 8000 },
    ],
  },
];
