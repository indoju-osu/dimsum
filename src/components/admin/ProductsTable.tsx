'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, Check, Loader2, Pencil } from 'lucide-react';
import type { AdminProductRow } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { TableWrap, Td, Th } from '@/components/admin/AdminUI';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Tabel produk admin.
 * - Stok dapat diubah langsung per baris (PATCH /api/admin/products/[id]).
 * - Produk yang pernah dipesan "diarsipkan" (DELETE) bukan dihapus permanen,
 *   sehingga riwayat pesanan tetap utuh.
 */
export function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Tidak ada produk yang cocok"
        description="Ubah kata kunci atau filter, atau tambahkan produk baru."
        action={
          <ButtonLink href="/admin/products/new" size="sm">
            Tambah produk
          </ButtonLink>
        }
      />
    );
  }

  async function saveStock(row: AdminProductRow) {
    const raw = stockDraft[row.id];
    if (raw === undefined || raw === String(row.stock)) return;
    setBusyId(row.id);
    try {
      const response = await fetch(`/api/admin/products/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: raw }),
      });
      const payload: { error?: string; stock?: number } = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error('Stok gagal disimpan', payload.error ?? 'Silakan coba lagi.');
        return;
      }
      toast.success('Stok diperbarui', `${row.name}: ${payload.stock ?? raw} pcs`);
      startTransition(() => router.refresh());
    } catch {
      toast.error('Stok gagal disimpan', 'Tidak dapat menghubungi server.');
    } finally {
      setBusyId(null);
    }
  }

  async function archiveProduct(row: AdminProductRow) {
    const confirmed = window.confirm(
      `Arsipkan produk "${row.name}"?\n\nProduk akan disembunyikan dari katalog dan ditandai tidak tersedia, tetapi riwayat pesanan tetap tersimpan.`,
    );
    if (!confirmed) return;

    setBusyId(row.id);
    try {
      const response = await fetch(`/api/admin/products/${row.id}`, { method: 'DELETE' });
      const payload: { error?: string; message?: string } = await response
        .json()
        .catch(() => ({}));
      if (!response.ok) {
        toast.error('Gagal mengarsipkan produk', payload.error ?? 'Silakan coba lagi.');
        return;
      }
      toast.success('Produk diarsipkan', payload.message ?? `${row.name} kini tidak tampil di katalog.`);
      startTransition(() => router.refresh());
    } catch {
      toast.error('Gagal mengarsipkan produk', 'Tidak dapat menghubungi server.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Produk</Th>
          <Th>Kategori</Th>
          <Th>Harga</Th>
          <Th>Stok</Th>
          <Th>Status</Th>
          <Th className="text-right">Aksi</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const busy = busyId === row.id;
          const draft = stockDraft[row.id] ?? String(row.stock);
          return (
            <tr key={row.id} className={cn('align-top', busy && 'opacity-70')}>
              <Td>
                <div className="flex gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone">
                    <ImageWithFallback src={row.image} alt={row.name} sizes="48px" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="link-underline font-medium text-forest"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-charcoal/70">{row.contentLabel}</p>
                    <p className="text-xs text-charcoal/55">
                      {row.soldCount} terjual · {row.variantCount} varian
                    </p>
                  </div>
                </div>
              </Td>
              <Td>{row.category.name}</Td>
              <Td>
                <span className="font-medium text-forest">{formatRupiah(row.finalPrice)}</span>
                {row.discountPrice !== null ? (
                  <span className="block text-xs text-charcoal/60 line-through">
                    {formatRupiah(row.price)}
                  </span>
                ) : null}
              </Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <label className="sr-only" htmlFor={`stock-${row.id}`}>
                    Stok {row.name}
                  </label>
                  <input
                    id={`stock-${row.id}`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={draft}
                    onChange={(event) =>
                      setStockDraft((prev) => ({ ...prev, [row.id]: event.target.value }))
                    }
                    className="h-11 w-20 rounded-xl border border-stone bg-white px-2 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2.5"
                    disabled={draft === String(row.stock) || busy}
                    onClick={() => saveStock(row)}
                    aria-label={`Simpan stok ${row.name}`}
                  >
                    {busy ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check aria-hidden className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {row.stock <= 5 ? (
                  <Badge tone={row.stock <= 0 ? 'danger' : 'harvest'} className="mt-1.5">
                    {row.stock <= 0 ? 'Stok habis' : 'Stok menipis'}
                  </Badge>
                ) : null}
              </Td>
              <Td>
                <div className="flex flex-col gap-1.5">
                  <Badge tone={row.isPublished ? 'olive' : 'neutral'}>
                    {row.isPublished ? 'Tampil' : 'Draft'}
                  </Badge>
                  <Badge tone={row.isAvailable ? 'sand' : 'danger'}>
                    {row.isAvailable ? 'Tersedia' : 'Tidak tersedia'}
                  </Badge>
                  {row.isFeatured ? <Badge tone="forest">Unggulan</Badge> : null}
                  {row.isPromo ? <Badge tone="harvest">Promo</Badge> : null}
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink
                    href={`/admin/products/${row.id}`}
                    variant="outline"
                    size="sm"
                    aria-label={`Ubah ${row.name}`}
                  >
                    <Pencil aria-hidden className="h-4 w-4" />
                    Ubah
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => archiveProduct(row)}
                    disabled={busy}
                    aria-label={`Arsipkan ${row.name}`}
                  >
                    <Archive aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
      {isPending ? (
        <tfoot>
          <tr>
            <Td colSpan={6} className="text-center text-xs text-charcoal/70">
              Memuat ulang data…
            </Td>
          </tr>
        </tfoot>
      ) : null}
    </TableWrap>
  );
}

export default ProductsTable;
