import { Spinner } from '@/components/ui/Misc';

/** Indikator pemuatan global saat halaman mengambil data dari server. */
export default function Loading() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16">
      <Spinner className="h-8 w-8" label="Memuat halaman" />
      <p className="text-sm text-charcoal/75">Memuat halaman…</p>
    </div>
  );
}
