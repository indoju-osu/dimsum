'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/FormControls';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/format';
import { CART_NOTICE_MESSAGE } from '@/lib/cart';
import { cn } from '@/lib/utils';
import type { ApiError, OrderCreateResponse } from '@/types';

type CheckoutFormProps = {
  brandName: string;
  shippingCost: number;
  freeShippingMin: number | null;
  storeAddress: string | null;
  operatingHours: string | null;
  whatsappConfigured: boolean;
  onBack: () => void;
};

/**
 * Form checkout: nama, nomor WhatsApp, metode ambil sendiri/pengiriman, alamat,
 * dan catatan. Pesanan dibuat lewat POST /api/orders (server memverifikasi ulang
 * harga & stok), lalu tautan WhatsApp dikirim ke pelanggan — tautan hanya dibuka
 * setelah pelanggan mengklik tombolnya sendiri.
 */
export function CheckoutForm({
  brandName,
  shippingCost,
  freeShippingMin,
  storeAddress,
  operatingHours,
  whatsappConfigured,
  onBack,
}: CheckoutFormProps) {
  const { lines, pricing, revalidate, clear } = useCart();
  const toast = useToast();
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    fulfillment: 'PICKUP' as 'PICKUP' | 'DELIVERY',
    address: '',
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OrderCreateResponse | null>(null);

  const freeShipping =
    form.fulfillment === 'DELIVERY' &&
    freeShippingMin !== null &&
    pricing.subtotal >= freeShippingMin;
  const estimatedShipping =
    form.fulfillment === 'DELIVERY' ? (freeShipping ? 0 : Math.max(0, shippingCost)) : 0;
  const estimatedTotal = pricing.subtotal + estimatedShipping;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSubmitError(null);

    const nextErrors: Record<string, string> = {};
    if (form.customerName.trim().length < 2) nextErrors.customerName = 'Nama lengkap wajib diisi.';
    const digits = form.customerPhone.replace(/[^\d+]/g, '');
    if (!/^(\+?62|0)\d{8,13}$/.test(digits)) {
      nextErrors.customerPhone = 'Nomor WhatsApp tidak valid (contoh: 08123456789).';
    }
    if (form.fulfillment === 'DELIVERY' && form.address.trim().length < 10) {
      nextErrors.address = 'Alamat lengkap wajib diisi untuk metode pengiriman (min. 10 karakter).';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Verifikasi ulang ke server lebih dulu supaya pelanggan melihat
      // perubahan harga/stok sebelum pesanan benar-benar dikirim.
      const validation = await revalidate();
      if (!validation || validation.items.length === 0) {
        setSubmitError(CART_NOTICE_MESSAGE.removed);
        return;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          fulfillment: form.fulfillment,
          address: form.fulfillment === 'DELIVERY' ? form.address : null,
          note: form.note,
          items: validation.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiError | null;
        if (payload?.details?.length) {
          setErrors(
            payload.details.reduce<Record<string, string>>((accumulator, detail) => {
              accumulator[detail.path] = detail.message;
              return accumulator;
            }, {}),
          );
        }
        setSubmitError(payload?.error ?? 'Pesanan gagal dibuat. Silakan coba lagi.');
        return;
      }

      const data = (await response.json()) as OrderCreateResponse;
      setResult(data);
      clear();
      toast.success('Pesanan dibuat', `Kode pesanan: ${data.order.orderNumber}`);
    } catch (error) {
      console.error('[checkout] Gagal membuat pesanan:', error);
      setSubmitError('Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <OrderSuccess
        result={result}
        brandName={brandName}
        whatsappConfigured={whatsappConfigured}
      />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card-surface space-y-4 p-8 text-center">
        <p className="text-charcoal/85">
          Keranjang Anda sudah kosong, jadi pesanan tidak dapat dibuat.
        </p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Kembali ke keranjang
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-forest underline decoration-harvest decoration-2 underline-offset-4"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Kembali ke keranjang
      </button>

      {submitError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-5 rounded-3xl border border-stone bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-forest">Data pemesan</h2>

          <Field
            label="Nama lengkap"
            htmlFor="checkout-name"
            required
            error={errors.customerName ?? null}
          >
            <Input
              id="checkout-name"
              name="customerName"
              autoComplete="name"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              invalid={Boolean(errors.customerName)}
              maxLength={100}
              required
            />
          </Field>

          <Field
            label="Nomor WhatsApp"
            htmlFor="checkout-phone"
            required
            hint="Kami menghubungi Anda melalui nomor ini untuk konfirmasi pesanan."
            error={errors.customerPhone ?? null}
          >
            <Input
              id="checkout-phone"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08123456789"
              value={form.customerPhone}
              onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
              invalid={Boolean(errors.customerPhone)}
              maxLength={20}
              required
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-forest">Metode pengambilan</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: 'PICKUP', label: 'Ambil sendiri di toko', hint: storeAddress ?? 'Alamat toko belum diatur pemilik usaha.' },
                  { value: 'DELIVERY', label: 'Dikirim ke alamat saya', hint: 'Ongkos kirim dikonfirmasi admin.' },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-2xl border p-3 transition',
                    form.fulfillment === option.value
                      ? 'border-forest bg-stone/60'
                      : 'border-stone bg-white hover:border-olive',
                  )}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value={option.value}
                    checked={form.fulfillment === option.value}
                    onChange={() => setForm({ ...form, fulfillment: option.value })}
                    className="mt-1 h-4 w-4 accent-forest"
                  />
                  <span>
                    <span className="block text-sm font-medium text-forest">{option.label}</span>
                    <span className="block text-xs text-charcoal/75">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {form.fulfillment === 'DELIVERY' ? (
            <Field
              label="Alamat pengiriman lengkap"
              htmlFor="checkout-address"
              required
              hint="Sertakan nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan bila perlu."
              error={errors.address ?? null}
            >
              <Textarea
                id="checkout-address"
                name="address"
                rows={3}
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                invalid={Boolean(errors.address)}
                maxLength={300}
                required
              />
            </Field>
          ) : operatingHours ? (
            <p className="rounded-2xl bg-olive/10 p-3 text-xs text-forest">
              Jam operasional: {operatingHours}
            </p>
          ) : null}

          <Field
            label="Catatan untuk admin (opsional)"
            htmlFor="checkout-note"
            hint="Misalnya permintaan saus tambahan, waktu pengambilan, atau instruksi khusus."
            error={errors.note ?? null}
          >
            <Textarea
              id="checkout-note"
              name="note"
              rows={3}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              maxLength={500}
            />
          </Field>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-3xl border border-stone bg-white p-5 shadow-card">
            <h2 className="font-display text-xl text-forest">Ringkasan pesanan</h2>
            <ul className="space-y-2 text-sm">
              {lines.map((line) => (
                <li
                  key={`${line.productId}-${line.variantId ?? 'default'}`}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="min-w-0 text-charcoal/85">
                    {line.name}
                    {line.variantName ? ` (${line.variantName})` : ''}
                    <span className="block text-xs text-charcoal/70">
                      {line.quantity} x {formatRupiah(line.unitPrice)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-forest">
                    {formatRupiah(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-stone pt-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-charcoal/75">Subtotal</dt>
                <dd className="font-medium text-forest">{formatRupiah(pricing.subtotal)}</dd>
              </div>
              {form.fulfillment === 'DELIVERY' ? (
                <div className="flex items-center justify-between">
                  <dt className="text-charcoal/75">Ongkos kirim</dt>
                  <dd className="font-medium text-forest">
                    {freeShipping
                      ? 'Gratis'
                      : shippingCost > 0
                        ? formatRupiah(shippingCost)
                        : 'Dikonfirmasi admin'}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-stone pt-2">
                <dt className="font-semibold text-forest">Total perkiraan</dt>
                <dd className="font-semibold text-forest">{formatRupiah(estimatedTotal)}</dd>
              </div>
            </dl>

            <p className="text-xs text-charcoal/70">
              Total akhir dihitung ulang oleh server berdasarkan harga dan stok terbaru saat
              pesanan dibuat.
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Mengirim pesanan…
                </>
              ) : (
                <>
                  <Send aria-hidden className="h-4 w-4" />
                  Buat Pesanan
                </>
              )}
            </Button>
            <p className="text-xs text-charcoal/70">
              Pesanan tercatat di sistem kami, lalu tautan WhatsApp akan muncul untuk Anda kirim ke{' '}
              {brandName}.
            </p>
          </div>
        </aside>
      </div>
    </form>
  );
}

/** Panel sukses: kode pesanan, catatan perubahan, dan tombol kirim WhatsApp. */
function OrderSuccess({
  result,
  brandName,
  whatsappConfigured,
}: {
  result: OrderCreateResponse;
  brandName: string;
  whatsappConfigured: boolean;
}) {
  const { order, whatsappUrl, priceUpdateNote, stockAdjustNote, removedNote } = result;

  return (
    <div className="space-y-6">
      <div className="card-surface space-y-4 p-6 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-olive/15 text-forest">
          <CheckCircle2 aria-hidden className="h-7 w-7" />
        </span>
        <h2 className="font-display text-2xl">Pesanan berhasil dibuat</h2>
        <p className="text-charcoal/85">
          Simpan kode pesanan berikut: <strong className="text-forest">{order.orderNumber}</strong>
        </p>
        <p className="mx-auto max-w-2xl text-sm text-charcoal/80">
          Status pesanan saat ini <strong>Menunggu Konfirmasi</strong>. Admin akan menghubungi Anda
          untuk memastikan ketersediaan, total akhir, dan jadwal pengambilan atau pengiriman.
        </p>
      </div>

      {priceUpdateNote || stockAdjustNote || removedNote ? (
        <div className="space-y-2" role="status">
          {priceUpdateNote ? (
            <p className="rounded-2xl border border-harvest/50 bg-harvest/10 p-4 text-sm text-forest">
              {priceUpdateNote}
            </p>
          ) : null}
          {stockAdjustNote ? (
            <p className="rounded-2xl border border-harvest/50 bg-harvest/10 p-4 text-sm text-forest">
              {stockAdjustNote}
            </p>
          ) : null}
          {removedNote ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {removedNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="card-surface space-y-4 p-6">
        <h3 className="font-display text-xl text-forest">Rincian pesanan</h3>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <span className="text-charcoal/85">
                {item.productName}
                {item.variantName ? ` (${item.variantName})` : ''}
                <span className="block text-xs text-charcoal/70">
                  {item.quantity} x {formatRupiah(item.unitPrice)}
                </span>
              </span>
              <span className="font-medium text-forest">{formatRupiah(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-stone pt-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-charcoal/75">Subtotal</dt>
            <dd className="font-medium text-forest">{formatRupiah(order.subtotal)}</dd>
          </div>
          {order.fulfillment === 'DELIVERY' ? (
            <div className="flex items-center justify-between">
              <dt className="text-charcoal/75">Ongkos kirim</dt>
              <dd className="font-medium text-forest">
                {order.shippingCost > 0
                  ? formatRupiah(order.shippingCost)
                  : 'Gratis / dikonfirmasi admin'}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-stone pt-2">
            <dt className="font-semibold text-forest">Total</dt>
            <dd className="font-semibold text-forest">{formatRupiah(order.total)}</dd>
          </div>
        </dl>
      </div>

      {whatsappUrl ? (
        <div className="space-y-3 text-center">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-6 font-semibold text-white transition hover:bg-[#0f7a6e]"
          >
            <MessageCircle aria-hidden className="h-5 w-5" />
            Kirim Pesanan via WhatsApp
          </a>
          <p className="text-xs text-charcoal/70">
            Tautan WhatsApp hanya terbuka setelah Anda menekan tombol di atas.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-sand bg-stone/50 p-4 text-sm text-charcoal/85">
          <p className="font-medium text-forest">Nomor WhatsApp toko belum diatur.</p>
          <p className="mt-1">
            Pesanan Anda sudah tersimpan dengan kode {order.orderNumber}. Minta pemilik {brandName}{' '}
            mengisi nomor WhatsApp pada dashboard admin agar konfirmasi otomatis dapat dibuat.
            {whatsappConfigured ? '' : ' Hubungi langsung admin bila Anda memiliki kontaknya.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={() => window.location.assign('/products')}>
          Pesan lagi
        </Button>
        <Button variant="ghost" onClick={() => window.location.assign('/')}>
          Kembali ke beranda
        </Button>
      </div>
    </div>
  );
}

export default CheckoutForm;
