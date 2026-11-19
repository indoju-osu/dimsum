# Dimsum Kita — Aplikasi Toko Online UMKM Dimsum

Aplikasi e-commerce B2C untuk UMKM kuliner dimsum: katalog produk, keranjang,
checkout tanpa payment gateway (pemesanan diteruskan ke WhatsApp toko), artikel,
testimoni, halaman profil usaha, dan dashboard admin lengkap.

Bukan mockup — seluruh halaman terhubung ke PostgreSQL melalui Prisma, dan
semua mutasi divalidasi ulang di server.

> Catatan data demo: nama brand, deskripsi, artikel, testimoni, dan pesanan
> contoh ditandai sebagai data demo. Nomor WhatsApp, alamat, dan info bisnis
> lainnya **sengaja dikosongkan** dan harus diisi pemilik usaha melalui
> `/admin/settings` (lihat [Pengaturan toko](#pengaturan-toko)).

---

## Fitur

**Halaman publik**

| Halaman | Isi |
| --- | --- |
| `/` | Hero, trust badge, kategori, "Favorit Pelanggan", produk terbaru, promo, artikel, testimoni, CTA WhatsApp |
| `/products` | Pencarian (debounce), filter kategori/harga/promo/best-seller, sort, paginasi, grid 2-3-4 kolom |
| `/products/[slug]` | Detail produk, galeri, varian, saran penyajian/penyimpanan, produk terkait |
| `/cart` | Keranjang berbasis localStorage, validasi harga & stok ke server, checkout ke WhatsApp |
| `/promotions` | Produk & paket promo beserta sisa waktu promo |
| `/articles`, `/articles/[slug]` | Daftar & detail artikel (markdown sederhana, aman dari XSS) |
| `/about` | Profil usaha, keunggulan, proses, testimoni, kontak |
| `/sitemap.xml`, `/robots.txt` | SEO dasar + JSON-LD (schema.org) |

**Dashboard admin** (`/admin`, login di `/admin/login`)

- Dashboard statistik: penjualan, pesanan terbaru, stok menipis, aktivitas.
- Produk: CRUD, varian, galeri, promo, publikasi, stok, arsip produk yang pernah dipesan.
- Kategori, Artikel (draft/published), Testimoni, Pesanan (ubah status), Pengaturan toko.
- Log aktivitas untuk setiap perubahan penting.

**Keamanan**

- Sesi admin: cookie `HttpOnly`, `Secure` (di produksi), `SameSite=Lax`, `Path=/`, `Max-Age` + tanda tangan HMAC-SHA256 (Web Crypto).
- Middleware: `/admin/*` tanpa sesi → 307 ke `/admin/login`; `/api/admin/*` tanpa sesi → 401. Setiap Route Handler memanggil ulang `requireAdmin()`.
- Mutasi API: pemeriksaan same-origin (CSRF) + rate limit pada login.
- Validasi Zod di semua input, sanitasi teks/tag HTML, escape JSON-LD, security headers di `next.config.mjs`.

---

## Stack

- Next.js (App Router) + React 19 + TypeScript `strict`
- Tailwind CSS 3 (palet Warm Ivory / Soft Stone / Sand Beige / Olive Sage / Harvest Gold / Forest Green / Charcoal)
- Font: Playfair Display + Plus Jakarta Sans via `next/font/google`
- Prisma + PostgreSQL
- Zod, Web Crypto (`crypto.subtle`), Vitest
- Target deployment: Vercel (tanpa penyimpanan file — lihat [Batasan](#batasan-yang-disengaja))

---

## Persyaratan

- Node.js 20 atau lebih baru
- npm (proyek memakai `package-lock.json`)
- PostgreSQL 14+ — atau tanpa instalasi apa pun: `npm run db:dev` menjalankan
  PostgreSQL lokal (paket `embedded-postgres`) pada port **55432**.

## Instalasi cepat (pengembangan)

```bash
# 1. Dependensi
npm install

# 2. Konfigurasi environment
cp .env.example .env      # lalu isi minimal DATABASE_URL & SESSION_SECRET

# 3. Database
npm run db:dev            # (terminal terpisah) PostgreSQL lokal port 55432
npm run db:deploy         # terapkan migrasi
npm run db:seed           # 8 kategori, 12 produk, 6 artikel, 5 testimoni, 4 pesanan demo

# 4. Jalankan
npm run dev               # http://localhost:3000
```

Bila memakai PostgreSQL sendiri, cukup ubah `DATABASE_URL` di `.env` dan
lewati langkah `npm run db:dev`.

## Variabel environment

Semua variabel beserta penjelasannya ada di [`.env.example`](.env.example).

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string PostgreSQL (produksi: tambahkan `sslmode=require`) |
| `SESSION_SECRET` | ya | Kunci HMAC cookie sesi, minimal 16 karakter (disarankan 32+ acak) |
| `NEXT_PUBLIC_SITE_URL` | ya (produksi) | Origin publik aplikasi untuk canonical URL & pencocokan Origin |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | saat seed | Kredensial akun admin awal |
| `STORE_*` | tidak | Nilai awal pengaturan toko saat seeding (nomor WA, alamat, email, sosial media) |
| `ALLOW_INSECURE_COOKIES` | tidak | `"1"` hanya untuk pengembangan di atas `http://localhost` |
| `ALLOW_DEMO_RESET` | tidak | `"true"` mengizinkan Reset Data Demo ketika `NODE_ENV=production` |

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build produksi (`prisma generate` + `next build`) / jalankan hasil build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |
| `npm test` | Vitest (unit + integration) |
| `npm run db:dev` | PostgreSQL lokal (embedded, port 55432) |
| `npm run db:deploy` / `npm run db:migrate` | Terapkan migrasi (produksi/dev) |
| `npm run db:seed` | Isi ulang data demo (menolak berjalan di `NODE_ENV=production` tanpa `--force`) |
| `npm run db:reset` | Reset database + migrasi (pengembangan) |
| `npm run db:studio` | Prisma Studio |
| `npm run format` | Prettier |

---

## Akun admin demo

```
URL      : /admin/login
Username : admin
Password : admin
```

Kredensial di atas dibuat oleh `npm run db:seed`. **Ganti sebelum publikasi**
dengan mengubah `ADMIN_PASSWORD` lalu menjalankan `npm run db:seed` (atau ubah
langsung pada database). Password disimpan sebagai hash scrypt
(`src/lib/password.ts`), bukan teks biasa.

## Alur pemesanan

1. Pelanggan menambahkan produk ke keranjang (tersimpan di localStorage).
2. Sebelum checkout, keranjang divalidasi ke `POST /api/cart/validate`: harga,
   ketersediaan, dan stok diambil ulang dari database.
3. Bila ada perubahan, muncul notifikasi:
   - `Harga beberapa produk telah diperbarui. Silakan periksa kembali pesanan Anda.`
   - `Terdapat perubahan stok. Jumlah produk dalam keranjang telah disesuaikan.`
   - `Maaf, produk ini sudah tidak tersedia dan telah dihapus dari keranjang.`
4. Pesanan disimpan (`POST /api/orders`) **lalu** tautan WhatsApp
   `https://wa.me/<nomor>?text=<encodeURIComponent(pesan)>` dibuka — hanya
   setelah aksi eksplisit dari pelanggan.
5. Admin menindaklanjuti lewat dashboard. **Stok tidak dipotong saat pesanan
   masuk**: stok dipotong secara atomik saat status diubah ke *Diproses*, dan
   dipulihkan bila pesanan *Dibatalkan* (dijaga flag `stockCommitted`).

Jika nomor WhatsApp belum diisi di `/admin/settings`, aplikasi tidak
mengarang nomor: keranjang menampilkan peringatan agar admin melengkapi
pengaturan lebih dahulu.

## Pengaturan toko

`/admin/settings` mengatur identitas brand, logo/favicon, deskripsi, nomor
WhatsApp (9–15 digit), alamat, jam operasional, sosial media, email, info
pengiriman & pembayaran, ongkos kirim, serta SEO. Halaman ini menampilkan
daftar informasi yang belum diisi agar tidak ada data bisnis yang terlewat.

### Reset data demo

Tombol **Reset Data Demo** memulihkan katalog, artikel, testimoni demo, dan
pesanan contoh ke kondisi awal. Pengamanan:

- wajib mengetik frasa konfirmasi `RESET DATA DEMO`;
- wajib sesi admin + permintaan same-origin;
- ditolak bila `NODE_ENV=production` kecuali `ALLOW_DEMO_RESET="true"`;
- hanya menyentuh data demo — **pengaturan toko, akun admin, dan pesanan asli
  pelanggan tidak dihapus**. Implementasi: `src/lib/demo-reset.ts`.

---

## Pengujian & pemeriksaan

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm test            # Vitest: unit (cart, WhatsApp, sanitasi, validasi, sesi) + integration (POST /api/cart/validate)
npm run build       # Build produksi
```

Checklist manual lengkap (A–E: instalasi, halaman publik, keranjang & checkout,
dashboard admin, keamanan & produksi) ada di
[`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md).

## Struktur proyek

```
prisma/            schema.prisma, migrasi, seed + seed-data (katalog & konten)
public/images/     aset gambar demo (lihat ATTRIBUTION.md)
scripts/dev-db.mjs PostgreSQL lokal untuk pengembangan
src/app/           route App Router: (public), admin, api, sitemap, robots
src/components/    UI: ui/, public/, admin/, cart/, layout/, shared/
src/lib/           database, prisma, session, auth, validation, sanitization,
                   cart, order, whatsapp, settings, demo-reset, dll.
src/middleware.ts  proteksi area admin
tests/             unit/ dan integration/
docs/              QA-CHECKLIST.md
```

## Deployment (Vercel)

1. **Database**: sediakan PostgreSQL (Neon, Supabase, RDS, dsb.) dan salin
   connection string beserta `sslmode=require`.
2. **Push repository** ke GitHub, lalu import proyek di Vercel.
3. **Environment Variables** (Production & Preview):
   `DATABASE_URL`, `SESSION_SECRET` (acak 32+ karakter), `NEXT_PUBLIC_SITE_URL`
   (mis. `https://tokodimsum.vercel.app`), opsional `STORE_*`.
4. **Migrasi & data awal** — jalankan dari mesin lokal/CI menuju database produksi:
   ```bash
   DATABASE_URL="<url-produksi>" npx prisma migrate deploy
   DATABASE_URL="<url-produksi>" ADMIN_PASSWORD="<password-kuat>" npm run db:seed -- --force
   ```
   `db:seed` memasukkan data demo; untuk produksi sebenarnya, cukup jalankan
   migrasi lalu isi katalog Anda sendiri dari dashboard admin.
5. **Build command** `npm run build` (sudah termasuk `prisma generate`),
   **output** default Next.js. Tidak ada konfigurasi khusus.
6. Setelah deploy, login ke `/admin/login`, ganti password admin, dan lengkapi
   `/admin/settings` (terutama nomor WhatsApp).
7. Uji ulang poin D dan E pada [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md)
   langsung di domain produksi.

## Batasan yang disengaja

- **Tidak ada unggah berkas ke server.** Vercel bersifat read-only, sehingga
  gambar produk diisi lewat *path* atau URL (mis. `/images/products/...`) dengan
  pratinjau di form admin. Simpan berkas di `public/images/...` atau gunakan
  CDN/penyimpanan objek bila ingin unggah dari dashboard.
- **Tidak ada payment gateway.** Pembayaran dikonfirmasi admin melalui WhatsApp;
  pesanan hanya bernilai "perkiraan total" sampai dikonfirmasi.
- Satu peran admin (tanpa multi-user/role).
- Notifikasi WhatsApp bergantung pada nomor yang diisi pemilik usaha.
- Foto produk bawaan adalah **aset ilustrasi demo**, bukan foto asli produk —
  ganti dengan foto asli sebelum publikasi.
