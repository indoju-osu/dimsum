import type { Metadata } from 'next';
import { BadgePercent, Clock, Truck } from 'lucide-react';
import { ProductCard } from '@/components/public/ProductCard';
import { SectionHeading, EmptyState } from '@/components/ui/Misc';
import { ButtonLink } from '@/components/ui/Button';
import { getPromoProducts, getNewArrivals } from '@/lib/database';
import { getStoreSettings } from '@/lib/settings';
import { formatRupiah } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Promo & Penawaran',
  description:
    'Kumpulan promo dimsum: potongan harga, paket hemat, dan penawaran spesial dari toko kami. Selama persediaan masih ada.',
  alternates: { canonical: '/promotions' },
};

/** Halaman promo: produk berdiskon, paket hemat, dan ketentuan promo. */
export default async function PromotionsPage() {
  const [promos, newArrivals, settings] = await Promise.all([
    getPromoProducts(24),
    getNewArrivals(4),
    getStoreSettings(),
  ]);

  const maximumSaving = promos.reduce(
    (max, product) => Math.max(max, product.price - product.finalPrice),
    0,
  );

  return (
    <div className="container-page section space-y-12">
      <SectionHeading
        eyebrow="Promo berjalan"
        title="Promo & Penawaran Spesial"
        description="Harga promo berlaku sesuai persediaan dan dapat berakhir tanpa pemberitahuan. Harga akhir selalu dihitung ulang oleh sistem saat pesanan dibuat."
        as="h1"
      />

      <ul className="grid gap-4 sm:grid-cols-3">
        <li className="card-surface flex items-start gap-3 p-5">
          <BadgePercent aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-olive" />
          <div>
            <p className="font-semibold text-forest">Hemat hingga {formatRupiah(maximumSaving)}</p>
            <p className="text-sm text-charcoal/80">
              Potongan terbesar pada produk yang sedang promo saat ini.
            </p>
          </div>
        </li>
        <li className="card-surface flex items-start gap-3 p-5">
          <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-olive" />
          <div>
            <p className="font-semibold text-forest">Selama persediaan ada</p>
            <p className="text-sm text-charcoal/80">
              Promo tidak berlaku kelipatan dengan diskon lain kecuali dituliskan admin.
            </p>
          </div>
        </li>
        <li className="card-surface flex items-start gap-3 p-5">
          <Truck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-olive" />
          <div>
            <p className="font-semibold text-forest">
              {settings.freeShippingMin && settings.freeShippingMin > 0
                ? `Gratis ongkir min. ${formatRupiah(settings.freeShippingMin)}`
                : 'Ongkos kirim dikonfirmasi admin'}
            </p>
            <p className="text-sm text-charcoal/80">
              {settings.shippingInfo ??
                'Detail pengiriman dan jangkauan area diinformasikan admin melalui WhatsApp.'}
            </p>
          </div>
        </li>
      </ul>

      {promos.length === 0 ? (
        <EmptyState
          title="Belum ada produk promo"
          description="Saat ini semua produk dijual dengan harga normal. Silakan lihat katalog lengkap kami."
          action={<ButtonLink href="/products">Lihat semua produk</ButtonLink>}
        />
      ) : (
        <section className="space-y-6" aria-labelledby="judul-daftar-promo">
          <h2 id="judul-daftar-promo" className="font-display text-2xl">
            Produk sedang promo
          </h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {promos.map((product, index) => (
              <li key={product.id}>
                <ProductCard product={product} priority={index < 4} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {newArrivals.length > 0 ? (
        <section className="space-y-6" aria-labelledby="judul-baru">
          <h2 id="judul-baru" className="font-display text-2xl">
            Baru di toko kami
          </h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card-surface space-y-3 p-6">
        <h2 className="font-display text-xl text-forest">Syarat &amp; ketentuan promo</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-charcoal/85">
          <li>Harga promo berlaku untuk pembelian melalui situs ini dan konfirmasi WhatsApp.</li>
          <li>Jumlah pembelian dapat dibatasi sesuai ketersediaan stok harian.</li>
          <li>Pesanan yang belum dikonfirmasi admin belum mengunci harga promo.</li>
          <li>Admin berhak memperbarui atau menghentikan promo sewaktu-waktu.</li>
        </ul>
      </section>
    </div>
  );
}
