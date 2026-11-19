/**
 * Data seed: artikel dan testimoni.
 *
 * Konten artikel adalah teks asli untuk keperluan demonstrasi.
 * Format konten: teks biasa dengan penanda sederhana.
 *   "## "   -> sub-judul
 *   "- "    -> item daftar
 *   baris kosong memisahkan paragraf
 * Renderer di src/components/public/ArticleBody.tsx mengubahnya menjadi
 * elemen React, TANPA dangerouslySetInnerHTML (aman terhadap XSS).
 *
 * Testimoni bawaan ditandai demo = true dan ditampilkan sebagai "ulasan contoh".
 */

export type SeedArticle = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  slug: string;
};

export type SeedTestimonial = {
  name: string;
  role: string;
  rating: number;
  content: string;
  demo: boolean;
};

export const seedArticles: SeedArticle[] = [
  {
    title: 'Tips Menyajikan Dimsum agar Lebih Nikmat',
    slug: 'tips-menyajikan-dimsum',
    excerpt:
      'Suhu, alat kukus, dan saus ternyata berpengaruh besar pada cita rasa dimsum. Berikut langkah sederhana yang bisa Anda ikuti di rumah.',
    coverImage: '/images/articles/tips-menyajikan-dimsum.webp',
    category: 'Tips',
    content: `Dimsum paling nikmat saat disajikan tepat setelah matang. Karena itu, cara menyajikannya hampir sama pentingnya dengan cara membuatnya.

## Pastikan air sudah mendidih

Masukkan dimsum ke kukusan setelah air benar-benar mendidih. Jika dimsum masuk terlalu awal, uap yang belum panas maksimal membuat kulit melempem dan isian kurang matang merata.

## Beri jarak antar dimsum

Susun dimsum dengan sedikit jarak. Menumpuk dimsum membuat uap tidak mengalir merata sehingga bagian tengah lebih lama matang dibanding bagian pinggir.

## Sajikan di wadah yang tepat

Gunakan piring atau wadah yang agak dalam agar saus tidak tumpah. Bila memakai kukusan bambu, sajikan langsung di atas meja supaya tetap hangat saat disantap.

## Pilih saus yang tidak menutupi rasa

- Saus manis: cocok untuk dimsum ayam dan paket campuran.
- Saus pedas: paling pas untuk dimsum mentai dan varian premium.
- Saus dengan sedikit asam: bagus untuk dimsum udang agar rasa manisnya lebih menonjol.

Hindari menuangkan saus terlalu banyak. Cukup cocolkan sedikit agar rasa isian dimsum tetap terasa.

## Waktu penyajian

Siapkan seluruh porsi dalam satu waktu bila memungkinkan. Bila jumlahnya banyak, gunakan beberapa kukusan dan sajikan bertahap agar tidak ada dimsum yang sudah dingin di meja.

Dengan langkah sederhana ini, dimsum yang Anda sajikan di rumah bisa terasa jauh lebih nikmat.`,
  },
  {
    title: 'Cara Mengukus Dimsum Frozen dengan Benar',
    slug: 'mengukus-dimsum-frozen',
    excerpt:
      'Tidak perlu dicairkan lebih dulu. Ikuti urutan berikut agar dimsum beku matang merata dan kulitnya tetap utuh.',
    coverImage: '/images/articles/mengukus-dimsum-frozen.webp',
    category: 'Panduan',
    content: `Dimsum frozen dibuat agar praktis. Kesalahan paling umum adalah mencairkannya di suhu ruang sebelum dikukus, padahal dimsum beku justru paling baik dikukus langsung.

## Siapkan kukusan

Isi bagian bawah kukusan dengan air dan panaskan hingga mendidih. Alasi bagian atas kukusan dengan kertas anti lengket atau olesi sedikit minyak agar tidak menempel.

## Atur dimsum dalam kondisi beku

Susun dimsum langsung dari freezer tanpa dicairkan. Beri jarak karena kulit dimsum yang masih beku cenderung lebih rapat.

## Kukus 12-15 menit

Waktu yang dibutuhkan lebih lama dibanding dimsum segar. Mulai hitung waktu sejak air kembali mendidih setelah dimsum dimasukkan.

## Cek kematangan

- Kulit tampak mengilap dan tidak lagi beku di bagian luar.
- Bagian tengah terasa panas saat ditusuk, tidak dingin.
- Tidak ada bagian yang masih keras seperti es.

## Hindari membuka kukusan terlalu sering

Setiap kali tutup dibuka, uap panas keluar dan waktu memasak bertambah. Cukup periksa sekali di menit terakhir.

## Bila ingin digoreng

Dimsum frozen sebaiknya tidak langsung digoreng karena bagian dalam belum matang. Kukus lebih dulu sekitar 8 menit, lalu goreng sebentar bila ingin permukaan yang lebih renyah.`,
  },
  {
    title: 'Perbedaan Dimsum Fresh dan Frozen',
    slug: 'perbedaan-dimsum-fresh-frozen',
    excerpt:
      'Keduanya sama-sama enak, tetapi cara simpan, waktu masak, dan momen penyajiannya berbeda. Ini panduan memilihnya.',
    coverImage: '/images/articles/perbedaan-fresh-frozen.webp',
    category: 'Edukasi',
    content: `Pertanyaan yang sering muncul: sebaiknya memesan dimsum fresh atau frozen? Jawabannya bergantung pada kapan Anda akan menyantapnya.

## Dimsum fresh

Dimsum fresh adalah dimsum yang belum dibekukan dan siap dikukus saat itu juga.

- Waktu masak lebih singkat, sekitar 7-10 menit.
- Tekstur kulit paling lembut.
- Sebaiknya dikonsumsi dalam 1-2 hari bila disimpan dingin.

Dimsum fresh paling pas untuk sajian hari itu, acara makan bersama, atau pesanan yang langsung dinikmati.

## Dimsum frozen

Dimsum frozen dibekukan segera setelah dibentuk sehingga kualitasnya terjaga lebih lama.

- Perlu waktu masak lebih lama, sekitar 12-15 menit.
- Bisa disimpan berminggu-minggu di freezer.
- Praktis untuk stok camilan di rumah.

## Cara memilih

- Akan dimakan hari ini: pilih dimsum fresh.
- Ingin stok untuk beberapa waktu: pilih dimsum frozen.
- Untuk acara: kombinasi keduanya sering kali paling efisien, karena dimsum frozen bisa dikukus sambil menunggu tamu datang.

## Yang perlu diperhatikan

Jangan mencairkan dimsum frozen di suhu ruang dalam waktu lama. Langsung kukus dari freezer agar tekstur kulit tetap baik dan keamanan pangan terjaga.`,
  },
  {
    title: 'Ide Menu Camilan untuk Keluarga',
    slug: 'ide-camilan-keluarga',
    excerpt:
      'Beberapa kombinasi dimsum dan pelengkap yang mudah disiapkan untuk kumpul keluarga di rumah.',
    coverImage: '/images/articles/ide-camilan-keluarga.webp',
    category: 'Inspirasi',
    content: `Menyiapkan camilan untuk keluarga tidak harus rumit. Dimsum bisa menjadi dasar yang fleksibel karena mudah dikombinasikan dengan banyak pelengkap.

## Kombinasi klasik

Dimsum ayam, saus manis, dan teh hangat. Kombinasi paling aman dan cocok untuk segala usia.

## Kombinasi untuk anak-anak

Dimsum mozzarella atau dimsum mentai dengan saus manis tanpa cabai. Keju yang meleleh biasanya paling disukai anak-anak.

## Kombinasi untuk kumpul malam

Dimsum campuran ditambah beberapa varian premium, saus pedas, dan keripik atau camilan gurih sebagai pendamping.

## Kombinasi praktis untuk tamu

- Sediakan beberapa varian dalam satu paket agar tamu bisa memilih.
- Kukus dalam dua batch supaya selalu ada yang hangat.
- Siapkan saus dalam wadah terpisah agar setiap orang bisa mengambil sesuai selera.

## Tambahan yang mudah

Beberapa pelengkap sederhana yang bisa melengkapi sajian:

- Acar timun untuk menambah kesegaran.
- Irisan cabai rawit bagi yang menyukai pedas.
- Sup bening hangat untuk menyeimbangkan rasa.

Dengan sedikit perencanaan, camilan dimsum bisa tersaji rapi tanpa membuat Anda sibuk di dapur sepanjang acara.`,
  },
  {
    title: 'Tips Menyimpan Dimsum agar Kualitasnya Terjaga',
    slug: 'tips-menyimpan-dimsum',
    excerpt:
      'Cara menyimpan menentukan tekstur dimsum saat dikukus kembali. Ikuti panduan berikut agar tidak lembek atau berbau.',
    coverImage: '/images/articles/tips-menyimpan-dimsum.webp',
    category: 'Panduan',
    content: `Dimsum yang disimpan dengan cara tepat akan hampir sama enaknya dengan dimsum yang baru dibuat. Sebaliknya, penyimpanan yang salah membuat kulit lembek dan aroma berkurang.

## Untuk penyimpanan singkat

Simpan dimsum di wadah tertutup di lemari pendingin. Letakkan selapis kertas penyerap di dasar wadah agar uap air tidak menggenang.

## Untuk penyimpanan lama

Bekukan dimsum dengan aturan berikut:

- Susun dimsum tanpa saling menempel, lalu bekukan sebentar.
- Setelah agak keras, pindahkan ke kantong atau wadah kedap udara.
- Beri label tanggal pembekuan agar mudah memantau usia simpan.

Cara ini mencegah dimsum saling menempel dan memudahkan mengambil sesuai porsi.

## Hindari cairkan lalu bekukan ulang

Setiap kali dimsum dicairkan, kualitas teksturnya menurun. Ambil hanya sejumlah yang akan dimasak, dan biarkan sisanya tetap beku.

## Menghangatkan kembali

Kukus kembali seperti biasa. Menghangatkan dengan microwave membuat kulit menjadi keras di beberapa bagian dan lembek di bagian lain.

## Tanda dimsum tidak layak dikonsumsi

- Aroma asam atau tidak sedap.
- Permukaan berlendir.
- Perubahan warna yang tidak wajar.

Bila salah satu tanda ini muncul, sebaiknya jangan dikonsumsi.`,
  },
];

export const seedTestimonials: SeedTestimonial[] = [
  {
    name: 'Rina',
    role: 'Ibu rumah tangga',
    rating: 5,
    demo: true,
    content:
      'Dimsum ayamnya lembut dan tidak berbau amis. Anak-anak suka, dan tinggal dikukus kalau mau makan. (Ulasan contoh)',
  },
  {
    name: 'Adi',
    role: 'Karyawan kantor',
    rating: 5,
    demo: true,
    content:
      'Buat bekal ke kantor praktis. Pesan paket mixed, tinggal kukus pagi-pagi sudah beres. (Ulasan contoh)',
  },
  {
    name: 'Sari',
    role: 'Mahasiswa',
    rating: 4,
    demo: true,
    content:
      'Harga masih ramah untuk kantong mahasiswa. Varian mentainya paling saya suka. (Ulasan contoh)',
  },
  {
    name: 'Keluarga Wijaya',
    role: 'Pelanggan paket keluarga',
    rating: 5,
    demo: true,
    content:
      'Ambil paket keluarga saat arisan, semua kebagian. Pengemasannya rapi waktu diambil. (Ulasan contoh)',
  },
  {
    name: 'Dewi',
    role: 'Reseller',
    rating: 5,
    demo: true,
    content:
      'Dimsum frozennya enak walaupun disimpan lama. Cocok dijual lagi untuk pelanggan saya. (Ulasan contoh)',
  },
];
