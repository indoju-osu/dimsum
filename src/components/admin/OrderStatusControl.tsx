'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatusValue } from '@/lib/constants';
import { ORDER_STATUS_LABEL, ORDER_STATUS_VALUES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/**
 * Kontrol perubahan status pesanan.
 *
 * Efek samping di server (src/lib/order.ts):
 * - PROCESSING memotong stok secara atomik (sekali saja, dijaga flag
 *   stockCommitted).
 * - CANCELLED memulihkan stok bila sebelumnya sudah dipotong.
 */
export function OrderStatusControl({
  orderId,
  orderNumber,
  status,
  stockCommitted,
}: {
  orderId: string;
  orderNumber: string;
  status: OrderStatusValue;
  stockCommitted: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<OrderStatusValue>(status);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const changed = selected !== status;
  const willCommitStock = selected === 'PROCESSING' && !stockCommitted;
  const willRestoreStock = selected === 'CANCELLED' && stockCommitted;

  async function handleSave() {
    if (!changed) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selected }),
      });
      const result: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error('Status gagal diubah', result.error ?? 'Silakan coba lagi.');
        return;
      }
      toast.success(
        'Status pesanan diperbarui',
        `${orderNumber} kini ${ORDER_STATUS_LABEL[selected]}.`,
      );
      startTransition(() => router.refresh());
    } catch {
      toast.error('Status gagal diubah', 'Tidak dapat menghubungi server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="order-status" className="block text-sm font-medium text-forest">
        Ubah status pesanan
      </label>
      <select
        id="order-status"
        value={selected}
        onChange={(event) => setSelected(event.target.value as OrderStatusValue)}
        className="min-h-[44px] w-full rounded-xl border border-stone bg-white px-3.5 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
      >
        {ORDER_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABEL[value]}
          </option>
        ))}
      </select>

      {willCommitStock ? (
        <p className="rounded-xl border border-harvest/50 bg-harvest/10 px-3.5 py-2.5 text-xs text-forest">
          Stok produk akan dipotong otomatis saat status disimpan (sekali saja untuk pesanan ini).
        </p>
      ) : null}
      {willRestoreStock ? (
        <p className="rounded-xl border border-sand bg-sand/20 px-3.5 py-2.5 text-xs text-forest">
          Stok yang sebelumnya dipotong akan dikembalikan karena pesanan dibatalkan.
        </p>
      ) : null}

      <Button onClick={handleSave} disabled={!changed || busy} loading={busy}>
        {busy ? 'Menyimpan…' : 'Simpan status'}
      </Button>
      {pending ? <p className="text-xs text-charcoal/70">Memuat ulang data…</p> : null}
      <p className="text-xs text-charcoal/60">
        Stok untuk pesanan ini {stockCommitted ? 'sudah dipotong' : 'belum dipotong'}.
      </p>
    </div>
  );
}

export default OrderStatusControl;
