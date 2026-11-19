import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/admin/LoginForm';
import { getStoreSettings } from '@/lib/settings';

export const metadata = { title: 'Login Admin' };

/** Halaman login admin. */
export default async function AdminLoginPage() {
  const settings = await getStoreSettings();

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-stone bg-white shadow-sm lg:grid-cols-2">
        <div className="hidden flex-col justify-between gap-8 bg-forest p-10 text-white lg:flex">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-harvest">
              {settings.brandName}
            </p>
            <h2 className="font-display text-3xl leading-snug">
              Kelola katalog, pesanan, dan konten toko dari satu tempat.
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-white/85">
            <li>• Perbarui harga, stok, dan status promo.</li>
            <li>• Proses pesanan dan potong stok secara otomatis.</li>
            <li>• Terbitkan artikel & testimoni pelanggan.</li>
          </ul>
          <p className="text-xs text-white/70">
            Sesi admin disimpan pada cookie HttpOnly bertanda tangan HMAC-SHA256.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <Suspense fallback={<p className="text-sm text-charcoal/70">Memuat formulir…</p>}>
            <LoginForm brandName={settings.brandName} />
          </Suspense>
          <p className="mt-6 text-center text-sm text-charcoal/70">
            <Link href="/" className="link-underline font-medium text-forest">
              Kembali ke halaman toko
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
