/**
 * Seed runner — mengisi database dengan data awal Dimsum Kita.
 *
 * Jalankan: npm run db:seed
 *
 * PERINGATAN: skrip ini MENGOSONGKAN tabel katalog, konten, dan pesanan
 * sebelum mengisi ulang. Aman untuk database pengembangan/demo, tetapi
 * JANGAN dijalankan pada database produksi tanpa sengaja. Karena itu skrip
 * menolak berjalan ketika NODE_ENV=production kecuali diberi flag --force.
 *
 * Logika penulisan data ada di `src/lib/demo-reset.ts` (dipakai juga oleh
 * tombol "Reset data demo" pada dashboard admin) agar hanya ada satu sumber
 * data demo.
 */
import { prisma } from '../src/lib/prisma';
import { resetDemoData } from '../src/lib/demo-reset';

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('[seed] Ditolak: NODE_ENV=production. Jalankan dengan --force bila Anda yakin.');
    process.exit(1);
  }

  console.info('[seed] Mengosongkan tabel data demo lalu mengisi ulang...');
  const result = await resetDemoData({ wipe: true, actor: 'Seed' });

  const counts = {
    kategori: await prisma.category.count(),
    produk: await prisma.product.count(),
    artikel: await prisma.article.count(),
    testimoni: await prisma.testimonial.count(),
    pesanan: await prisma.order.count(),
  };
  console.info('[seed] Selesai:', counts, `(${result.mode})`);

  const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
  if ((process.env.ADMIN_PASSWORD ?? 'admin') === 'admin') {
    console.warn(
      '[seed] PERINGATAN: akun admin memakai password default "admin". Ganti sebelum deployment publik.',
    );
  }
  console.info('[seed] Akun admin demo:', username);
}

main()
  .catch((error) => {
    console.error('[seed] Gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
