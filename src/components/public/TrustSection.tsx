import { HandHeart, Leaf, ShieldCheck, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    title: 'Bahan Pilihan',
    description:
      'Dimsum dibuat dari bahan segar pilihan tanpa pengawet tambahan, dikukus hingga matang sempurna.',
    icon: Leaf,
  },
  {
    title: 'Kualitas Terjaga',
    description:
      'Setiap batch diperiksa sebelum dikirim. Informasi komposisi dapat ditanyakan langsung ke admin.',
    icon: ShieldCheck,
  },
  {
    title: 'Pesan Mudah via WhatsApp',
    description:
      'Tanpa perlu membuat akun. Isi keranjang, kirim pesanan, lalu konfirmasi langsung dengan admin.',
    icon: HandHeart,
  },
  {
    title: 'Ambil Sendiri atau Kirim',
    description:
      'Pilih ambil sendiri di toko atau pengiriman. Ongkos kirim dikonfirmasi admin sesuai alamat Anda.',
    icon: Truck,
  },
] as const;

/** Kartu kepercayaan (4 kartu) di halaman beranda. */
export function TrustSection() {
  return (
    <section className="container-page section">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="flex h-full flex-col gap-3 rounded-3xl border border-stone bg-white p-5 shadow-soft"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-olive/15 text-forest">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-charcoal/80">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TrustSection;
