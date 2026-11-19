'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

/** Halaman error global (client component sesuai aturan Next.js App Router). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] Terjadi error pada halaman:', error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <p className="eyebrow">Terjadi kesalahan</p>
      <h1 className="font-display text-3xl sm:text-4xl">Halaman gagal dimuat</h1>
      <p className="max-w-xl text-charcoal/80">
        Maaf atas ketidaknyamanannya. Silakan coba muat ulang halaman ini. Bila masalah berlanjut,
        hubungi admin toko melalui halaman Tentang Kami.
      </p>
      {error.digest ? (
        <p className="text-xs text-charcoal/60">Kode referensi: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <ButtonLink href="/" variant="outline">
          Kembali ke beranda
        </ButtonLink>
      </div>
    </div>
  );
}
