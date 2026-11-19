# QA Checklist — Dimsum Kita

Checklist pemeriksaan manual sebelum aplikasi diserahkan/di-deploy.
Jalankan dari atas ke bawah pada satu lingkungan (pengembangan atau produksi)
dan catat hasilnya.

Legenda: `[ ]` belum diperiksa · `[x]` lolos · `[!]` gagal/temuan (tulis catatan)

Pemeriksaan otomatis (jalankan lebih dahulu):

```bash
npm run typecheck   # harus tanpa error
npm run lint        # harus tanpa error
npm test            # 73 test (unit + integration)
npm run build       # build produksi harus sukses
```

---

## A. Instalasi, konfigurasi, dan build

- [ ] `npm install` selesai tanpa error dan `package-lock.json` tidak berubah tak sengaja.
- [ ] `.env` dibuat dari `.env.example`; `DATABASE_URL` dan `SESSION_SECRET` terisi.
- [ ] `SESSION_SECRET` acak ≥ 32 karakter (bukan nilai contoh).
- [ ] `npm run db:deploy` menerapkan seluruh migrasi tanpa error.
- [ ] `npm run db:seed` selesai; output mencatat jumlah kategori/produk/artikel/testimoni/pesanan.
- [ ] `npm run db:seed` **menolak** berjalan saat `NODE_ENV=production` tanpa `--force`.
- [ ] `npm run dev` menyala tanpa error di terminal; `http://localhost:3000` terbuka.
- [ ] `npm run build` sukses, lalu `npm start` menyajikan aplikasi.
- [ ] `npm run db:dev` (embedded Postgres) berjalan pada port 55432 dan bisa dihentikan dengan Ctrl+C.

## B. Halaman publik & tampilan

- [ ] Beranda: hero, trust badge, kategori, "Favorit Pelanggan", produk terbaru, promo, artikel, testimoni, CTA WhatsApp semuanya terisi (bukan placeholder kosong).
- [ ] Header sticky: tautan Beranda/Produk/Promo/Artikel/Tentang Kami berfungsi; badge jumlah keranjang tampil.
- [ ] Drawer menu mobile terbuka/tertutup, fokus berpindah wajar, `Esc` menutup drawer.
- [ ] `/products`: pencarian mengetik cepat tidak membanjiri server (debounce), hasil ikut berubah.
- [ ] `/products`: filter kategori, rentang harga, promo, best-seller dapat dikombinasikan dan bisa direset.
- [ ] `/products`: urutan (populer/terbaru/harga/nama) berubah sesuai pilihan.
- [ ] `/products`: grid 2 kolom (375–639px), 3 kolom (≥640px), 4 kolom (≥1024px) dan paginasi bekerja.
- [ ] `/products`: pencarian tanpa hasil menampilkan keadaan kosong yang informatif.
- [ ] `/products/[slug]`: galeri, harga/diskon, varian, stok, saran penyajian & penyimpanan tampil benar.
- [ ] Produk promo menampilkan harga sebelum/sesudah dan sisa waktu promo.
- [ ] `/cart` kosong menampilkan keadaan kosong + tautan kembali ke katalog.
- [ ] `/promotions`: hanya produk promo yang tampil.
- [ ] `/articles`: filter kategori artikel bekerja; artikel berstatus *draft* **tidak** muncul.
- [ ] `/articles/[slug]`: konten terbaca, tautan kembali berfungsi.
- [ ] `/about`: profil, proses, keunggulan, dan testimoni tampil.
- [ ] Footer menampilkan nama brand, kontak, jam operasional, dan tautan sosial media dari pengaturan toko.
- [ ] Nomor WhatsApp/alamat **tidak** menampilkan nilai karangan bila belum diisi di pengaturan.
- [ ] Halaman 404 (`/halaman-tidak-ada`) dan halaman error tampil rapi.
- [ ] Responsif 375px, 768px, 1024px, 1440px, 1920px: tidak ada teks terpotong/overflow horizontal.
- [ ] Kontras teks memenuhi WCAG AA (charcoal/forest di atas ivory/stone; teks putih di atas forest).
- [ ] Tombol & input minimal 44px, indikator fokus terlihat saat menavigasi dengan `Tab`.
- [ ] `sitemap.xml` dan `robots.txt` dapat diakses dan berisi URL yang benar.

## C. Keranjang, checkout, dan WhatsApp

- [ ] Menambahkan produk (satu varian) menambah badge keranjang dan tersimpan setelah halaman dimuat ulang.
- [ ] Menambahkan produk & varian sama menggabungkan jumlah; varian berbeda menjadi baris terpisah.
- [ ] Jumlah di keranjang tidak bisa melebihi stok dan batas 99.
- [ ] Ubah jumlah di `/cart`, hapus item → total dan jumlah item ikut berubah seketika.
- [ ] Keranjang bertahan setelah refresh (localStorage) dan data rusak/versi lama diabaikan tanpa error.
- [ ] Validasi harga: ubah harga produk di `/admin/products`, muat ulang `/cart` → muncul “Harga beberapa produk telah diperbarui. Silakan periksa kembali pesanan Anda.”, harga di keranjang mengikuti database.
- [ ] Validasi stok: turunkan stok di bawah jumlah keranjang → muncul “Terdapat perubahan stok. Jumlah produk dalam keranjang telah disesuaikan.”
- [ ] Produk dinonaktifkan/dihabiskan setelah masuk keranjang → muncul “Maaf, produk ini sudah tidak tersedia dan telah dihapus dari keranjang.”
- [ ] Harga yang diubah di localStorage **tidak** mengubah total yang dihitung server (uji: ubah `unitPrice` di localStorage lalu validasi).
- [ ] Form checkout: nama, nomor WhatsApp, metode, alamat (wajib bila pengiriman), catatan.
- [ ] Form menolak nama terlalu pendek, nomor tidak valid, dan pengiriman tanpa alamat, dengan pesan kesalahan jelas.
- [ ] Checkout berhasil menyimpan pesanan (terlihat di `/admin/orders`) dengan kode pesanan `DM-…`.
- [ ] Tautan WhatsApp hanya terbuka setelah klik tombol; pesan memuat daftar item, jumlah, subtotal, total, data pemesan, dan kode pesanan.
- [ ] Pesan WhatsApp ter-encode benar (baris baru, `&`, karakter khusus tidak memotong pesan).
- [ ] Bila nomor WhatsApp toko belum diisi: muncul peringatan jelas dan **tidak** ada tautan WA dengan nomor karangan.
- [ ] Stok **tidak** berkurang saat pesanan masuk (baru berkurang saat status → Diproses).

## D. Dashboard admin

- [ ] Membuka `/admin` saat belum login → 307 ke `/admin/login`; `/api/admin/*` → 401 JSON.
- [ ] Login salah beberapa kali berturut-turut → rate limit aktif dan pesan jelas.
- [ ] Login `admin`/`admin` berhasil; cookie sesi `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` terpasang, dan `Secure` aktif pada HTTPS produksi.
- [ ] Setelah login, `/admin/login` mengalihkan ke `/admin`; Logout menghapus cookie dan kembali ke halaman login.
- [ ] Dashboard: jumlah produk/pesanan/pendapatan, pesanan terbaru, stok menipis, dan log aktivitas konsisten dengan data.
- [ ] Produk: tambah produk baru (nama, kategori, harga, stok, satuan isi, gambar path/URL + pratinjau) → tampil di katalog publik.
- [ ] Produk: ubah produk (termasuk varian & galeri) → perubahan tampil di halaman publik.
- [ ] Produk: validasi menolak harga negatif, stok negatif, nama terlalu pendek, dan gambar berisi skrip (`javascript:`).
- [ ] Produk: sembunyikan dari publikasi (`isPublished=false`) → hilang dari katalog, tetap ada di admin.
- [ ] Produk: hapus produk yang belum pernah dipesan → terhapus; produk yang pernah dipesan → terarsip (tidak hilang dari riwayat pesanan).
- [ ] Kategori: tambah/ubah/ubah urutan; menghapus kategori yang masih dipakai produk ditolak (409) dengan saran menonaktifkannya.
- [ ] Pesanan: daftar dapat difilter/dicari; detail menampilkan item, total, dan data pemesan.
- [ ] Pesanan: ubah status ke Diproses → stok berkurang jumlah yang benar; ulang status tidak mengurangi dua kali.
- [ ] Pesanan: ubah status ke Dibatalkan setelah stok terpotong → stok dipulihkan; ubah ke Batal sebelum dipotong → stok tidak berubah.
- [ ] Artikel: buat draft → tidak tampil publik; ubah ke Published → tampil dan muncul di sitemap.
- [ ] Testimoni: tampilkan/sembunyikan berpengaruh pada halaman publik; testimoni demo tetap ditandai sebagai data demo.
- [ ] Pengaturan: banner menampilkan daftar informasi yang belum diisi.
- [ ] Pengaturan: simpan identitas/kontak/pengiriman/SEO → header, footer, dan metadata halaman publik ikut berubah.
- [ ] Pengaturan: nomor WhatsApp salah format ditolak dengan pesan validasi.
- [ ] Pengaturan: **Reset Data Demo** — dialog konfirmasi muncul; frasa salah ditolak tanpa mengubah data.
- [ ] Reset Data Demo dengan frasa benar memulihkan katalog/artikel/testimoni demo/pesanan demo.
- [ ] Setelah Reset Data Demo: pengaturan toko, akun admin (dan password yang sudah diubah), serta pesanan asli **tetap ada**.
- [ ] Reset Data Demo ditolak pada `NODE_ENV=production` tanpa `ALLOW_DEMO_RESET="true"`.
- [ ] Setiap mutasi penting tercatat di log aktivitas.

## E. Keamanan & kesiapan produksi

- [ ] `next.config.mjs`: header keamanan aktif (`X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, HSTS saat produksi) — periksa di tab Network.
- [ ] Mutasi API dengan `Origin` berbeda/absen → 403 (uji dengan `curl` tanpa header `Origin`).
- [ ] Mutasi API tanpa cookie sesi → 401, walaupun menembus halaman admin.
- [ ] Input berisi HTML/`<script>`/`javascript:` tersimpan sebagai teks biasa; tidak pernah dieksekusi di halaman publik maupun admin.
- [ ] JSON-LD tidak dapat keluar dari tag `<script>` (uji nama produk berisi `</script>`).
- [ ] `.env` tidak ikut ter-commit (`git status` bersih dari `.env`, `.pgdata`, `_scratch`).
- [ ] `STORE_WHATSAPP`, alamat, testimoni, dan artikel demo sudah disesuaikan/ditandai sebelum publikasi.
- [ ] Password admin demo sudah diganti dan `ADMIN_PASSWORD` di produksi tidak bernilai `admin`.
- [ ] Foto ilustrasi diganti dengan foto asli, dan `public/images/ATTRIBUTION.md` diperbarui.
- [ ] `NEXT_PUBLIC_SITE_URL` menunjuk domain produksi (canonical URL & pencocokan Origin benar).
- [ ] Migrasi diterapkan ke database produksi dengan `prisma migrate deploy` (bukan `db push`).
- [ ] Uji cepat di domain produksi: beranda, katalog, detail produk, keranjang → WhatsApp, login admin, ubah status pesanan.

---

Catatan temuan:

```
Tanggal / pemeriksa:
Lingkungan:
Temuan:
```
