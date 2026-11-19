# Atribusi & status aset gambar

## Ringkasan

Seluruh berkas pada `public/images/**` (dan ikon di `public/`) adalah **aset
ilustrasi untuk keperluan demo dan pengembangan aplikasi**. Gambar-gambar ini
**bukan foto asli produk maupun tempat usaha**, dan tidak boleh ditampilkan
sebagai dokumentasi produk nyata.

| Yang perlu diganti pemilik usaha | Lokasi |
| --- | --- |
| Foto produk | `public/images/products/` lalu perbarui kolom gambar di `/admin/products` |
| Foto kategori | `public/images/categories/` |
| Foto hero beranda | `public/images/hero/` |
| Foto halaman "Tentang Kami" | `public/images/about/` |
| Ilustrasi artikel | `public/images/articles/` |
| Logo, favicon, ikon, gambar OG | `public/images/logo.svg`, `public/icon.png`, `public/apple-icon.png`, `public/images/favicon-32.png`, `public/images/favicon.ico.png`, `public/images/og-default.png` |
| Gambar pengganti saat foto gagal dimuat | `public/images/fallback-product.webp` (dipakai komponen `ImageWithFallback`) |

Pemilik usaha perlu memperbarui tabel di bawah ini ketika menambahkan foto asli
agar jelas asal dan izin penggunaannya (mis. "Dokumentasi sendiri" atau nama
pemilik foto beserta tautan sumber dan jenis lisensinya).

## Status per berkas

| Berkas | Status | Catatan |
| --- | --- | --- |
| `products/dimsum-ayam-original.webp` | Aset ilustrasi demo | Bukan foto produk asli — ganti sebelum publikasi |
| `products/dimsum-ayam-jamur.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-udang-premium.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-mentai.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-mozzarella.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-beef.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-nori.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-crabstick.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-frozen-original.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/dimsum-frozen-premium.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/paket-dimsum-mix.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `products/paket-keluarga.webp` | Aset ilustrasi demo | Bukan foto produk asli |
| `categories/*.webp` (8 berkas) | Aset ilustrasi demo | Foto kategori contoh |
| `hero/hero-utama.webp`, `hero/hero-ayam.webp`, `hero/hero-udang.webp`, `hero/hero-saus.webp`, `hero/hero-wadah.webp` | Aset ilustrasi demo | Bukan foto tempat/produk asli |
| `about/dapur-kami.webp`, `about/proses-produksi.webp`, `about/aktivitas-usaha.webp` | Aset ilustrasi demo | **Jangan** dipresentasikan sebagai foto dapur/usaha asli sebelum diganti |
| `articles/*.webp` (5 berkas) | Aset ilustrasi demo | Ilustrasi artikel |
| `logo.svg` | Aset demo | Logo sementara; ganti dengan logo resmi usaha |
| `fallback-product.webp`, `fallback-product.svg` | Aset aplikasi | Placeholder netral untuk gambar yang gagal dimuat |
| `icon.png`, `apple-icon.png`, `favicon-32.png`, `favicon.ico.png`, `og-default.png` | Aset demo | Ikon & gambar pratinjau tautan — ganti dengan identitas resmi |

## Penandaan di aplikasi

- Teks halaman "Tentang Kami" dan artikel tidak mengklaim foto sebagai
  dokumentasi resmi; narasi disusun sebagai contoh usaha kuliner.
- Testimoni contoh ditandai `isDemoData` dan tampil sebagai data demo di
  dashboard admin.
- Bila Anda ingin menghapus seluruh gambar demo: ganti berkasnya dengan foto
  sendiri tanpa mengubah nama, atau perbarui kolom gambar produk/kategori di
  dashboard admin.
