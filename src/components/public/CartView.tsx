'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowRight, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { QuantitySelector } from './QuantitySelector';
import { CheckoutForm } from './CheckoutForm';
import { useCart } from '@/hooks/useCart';
import { CART_NOTICE_MESSAGE, CART_NOTICE_TITLE } from '@/lib/cart';
import { formatRupiah } from '@/lib/format';

/**
 * Halaman keranjang: daftar produk, pengubahan jumlah, notifikasi perubahan
 * harga/stok dari server (teks persis spesifikasi), dan langkah checkout.
 */
export function CartView({
  brandName,
  shippingCost,
  freeShippingMin,
  storeAddress,
  operatingHours,
  whatsappConfigured,
}: {
  brandName: string;
  shippingCost: number;
  freeShippingMin: number | null;
  storeAddress: string | null;
  operatingHours: string | null;
  whatsappConfigured: boolean;
}) {
  const { lines, pricing, hydrated, setQuantity, removeItem, clear, revalidate, isRevalidating } =
    useCart();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [notice, setNotice] = useState<{
    priceUpdated: boolean;
    stockAdjusted: boolean;
    removed: boolean;
  } | null>(null);

  const handleRevalidate = async () => {
    const result = await revalidate();
    if (result) setNotice(result.notice);
  };

  if (!hydrated) {
    return (
      <div className="card-surface p-8 text-center text-charcoal/75">Memuat keranjang…</div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag aria-hidden className="h-6 w-6" />}
        title="Keranjang Anda masih kosong"
        description="Pilih dimsum favorit Anda terlebih dahulu, lalu kembali ke halaman ini untuk menyelesaikan pesanan."
        action={<ButtonLink href="/products">Lihat produk</ButtonLink>}
      />
    );
  }

  if (step === 'checkout') {
    return (
      <CheckoutForm
        brandName={brandName}
        shippingCost={shippingCost}
        freeShippingMin={freeShippingMin}
        storeAddress={storeAddress}
        operatingHours={operatingHours}
        whatsappConfigured={whatsappConfigured}
        onBack={() => setStep('cart')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {notice && (notice.priceUpdated || notice.stockAdjusted || notice.removed) ? (
        <div className="space-y-2" role="status" aria-live="polite">
          {notice.priceUpdated ? (
            <NoticeRow
              icon={<AlertCircle aria-hidden className="h-4 w-4" />}
              title={CART_NOTICE_TITLE.priceUpdated}
              message={CART_NOTICE_MESSAGE.priceUpdated}
            />
          ) : null}
          {notice.stockAdjusted ? (
            <NoticeRow
              icon={<AlertCircle aria-hidden className="h-4 w-4" />}
              title={CART_NOTICE_TITLE.stockAdjusted}
              message={CART_NOTICE_MESSAGE.stockAdjusted}
            />
          ) : null}
          {notice.removed ? (
            <NoticeRow
              icon={<AlertCircle aria-hidden className="h-4 w-4" />}
              tone="danger"
              title={CART_NOTICE_TITLE.removed}
              message={CART_NOTICE_MESSAGE.removed}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Daftar produk di keranjang" className="space-y-3">
          {lines.map((line) => (
            <article
              key={`${line.productId}-${line.variantId ?? 'default'}`}
              className="flex gap-4 rounded-3xl border border-stone bg-white p-4 shadow-soft"
            >
              <Link
                href={`/products/${line.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-stone bg-stone/40"
              >
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized={line.image.startsWith('http')}
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-forest">
                      <Link href={`/products/${line.slug}`} className="link-underline">
                        {line.name}
                      </Link>
                    </h2>
                    {line.variantName ? (
                      <p className="text-xs text-charcoal/70">Varian: {line.variantName}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-charcoal/80">
                      {formatRupiah(line.unitPrice)} / porsi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.productId, line.variantId)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                    aria-label={`Hapus ${line.name} dari keranjang`}
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <QuantitySelector
                    value={line.quantity}
                    onChange={(quantity) => setQuantity(line.productId, line.variantId, quantity)}
                  />
                  <p className="font-semibold text-forest">
                    {formatRupiah(line.unitPrice * line.quantity)}
                  </p>
                </div>
              </div>
            </article>
          ))}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={handleRevalidate} disabled={isRevalidating}>
              <RefreshCw aria-hidden className={`h-4 w-4 ${isRevalidating ? 'animate-spin' : ''}`} />
              {isRevalidating ? 'Memeriksa…' : 'Periksa harga & stok terbaru'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
                setNotice(null);
              }}
            >
              Kosongkan keranjang
            </Button>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-3xl border border-stone bg-white p-5 shadow-card">
            <h2 className="font-display text-xl text-forest">Ringkasan pesanan</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-charcoal/75">Jumlah item</dt>
                <dd className="font-medium text-forest">{pricing.totalQuantity} porsi</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-charcoal/75">Subtotal</dt>
                <dd className="font-semibold text-forest">{formatRupiah(pricing.subtotal)}</dd>
              </div>
            </dl>

            {freeShippingMin && freeShippingMin > 0 ? (
              <p className="rounded-2xl bg-olive/10 p-3 text-xs text-forest">
                {pricing.subtotal >= freeShippingMin
                  ? `Selamat! Pesanan Anda sudah memenuhi syarat gratis ongkir (minimal ${formatRupiah(freeShippingMin)}).`
                  : `Gratis ongkir untuk pembelian minimal ${formatRupiah(freeShippingMin)}.`}
              </p>
            ) : null}

            <p className="text-xs text-charcoal/70">
              Ongkos kirim {shippingCost > 0 ? formatRupiah(shippingCost) : 'dikonfirmasi admin'} dan
              total akhir akan dihitung ulang oleh server saat pesanan dibuat.
            </p>

            <Button size="lg" className="w-full" onClick={() => setStep('checkout')}>
              Lanjut ke Checkout
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
            <ButtonLink href="/products" variant="ghost" size="sm" className="w-full">
              Tambah produk lain
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NoticeRow({
  icon,
  title,
  message,
  tone = 'warning',
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  tone?: 'warning' | 'danger';
}) {
  return (
    <div
      className={
        tone === 'danger'
          ? 'flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800'
          : 'flex items-start gap-3 rounded-2xl border border-harvest/50 bg-harvest/10 p-4 text-sm text-forest'
      }
    >
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default CartView;
