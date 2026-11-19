import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

export const metadata = { title: 'Halaman tidak ditemukan' };

/** Halaman 404 global. */
export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="font-display text-3xl sm:text-4xl">Halaman tidak ditemukan</h1>
      <p className="max-w-xl text-charcoal/80">
        Sepertinya tautan yang Anda buka sudah dipindahkan atau tidak pernah ada. Silakan kembali ke
        beranda atau lihat katalog produk kami.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Kembali ke beranda</ButtonLink>
        <ButtonLink href="/products" variant="outline">
          Lihat produk
        </ButtonLink>
      </div>
      <p className="text-sm text-charcoal/70">
        Butuh bantuan? Buka halaman{' '}
        <Link href="/about" className="link-underline font-medium text-forest">
          Tentang Kami
        </Link>{' '}
        untuk informasi kontak toko.
      </p>
    </div>
  );
}
