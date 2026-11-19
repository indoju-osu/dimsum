'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, MessageCircle, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, PriceTag } from '@/components/ui/Misc';
import { QuantitySelector } from './QuantitySelector';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProductDetail } from '@/types';

/**
 * Panel pembelian halaman detail produk:
 * - pilih varian (bila ada) dan jumlah,
 * - harga dihitung dari harga server (diskon + penyesuaian varian),
 * - tombol tambah ke keranjang dan tautan tanya stok via WhatsApp.
 */
export function ProductPurchasePanel({
  product,
  whatsappUrl,
  storeAddress,
}: {
  product: ProductDetail;
  whatsappUrl: string | null;
  storeAddress: string | null;
}) {
  const { addItem } = useCart();
  const toast = useToast();
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.find((variant) => variant.isDefault)?.id ?? product.variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === variantId) ?? null,
    [product.variants, variantId],
  );

  const basePrice = product.discountPrice ?? product.price;
  const unitPrice = Math.max(0, basePrice + (selectedVariant?.priceAdjustment ?? 0));
  const maxQuantity = Math.max(1, Math.min(product.stock, 99));
  const soldOut = product.isSoldOut || !product.isAvailable || product.stock <= 0;
  const total = unitPrice * quantity;

  const handleAdd = () => {
    if (soldOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      unitPrice,
      quantity,
    });
    toast.success('Ditambahkan ke keranjang', `${product.name} x${quantity}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {product.isBestSeller ? <Badge tone="harvest">Favorit Pelanggan</Badge> : null}
        {product.isPromo ? <Badge tone="danger">Promo</Badge> : null}
        {product.isNewArrival ? <Badge tone="olive">Baru</Badge> : null}
      </div>

      <PriceTag price={product.price} discountPrice={product.discountPrice} size="lg" />

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal/80">
        <span className="inline-flex items-center gap-1.5">
          <PackageCheck aria-hidden className="h-4 w-4 text-olive" />
          {product.contentLabel}
        </span>
        {product.weightGram ? <span>{product.weightGram} gram</span> : null}
      </p>

      <p className="text-sm">
        {soldOut ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
            <AlertTriangle aria-hidden className="h-4 w-4" />
            Stok sedang habis
          </span>
        ) : (
          <span className="text-charcoal/80">
            Stok tersedia: <strong className="text-forest">{product.stock}</strong> porsi
          </span>
        )}
      </p>

      {product.variants.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-forest">Pilih varian</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isActive = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'min-h-[44px] rounded-xl border px-4 text-sm font-medium transition',
                    isActive
                      ? 'border-forest bg-forest text-white'
                      : 'border-stone bg-white text-forest hover:border-olive',
                  )}
                >
                  {variant.name}
                  {variant.priceAdjustment !== 0 ? (
                    <span className="ml-1 text-xs">
                      ({variant.priceAdjustment > 0 ? '+' : '-'}
                      {formatRupiah(Math.abs(variant.priceAdjustment)).replace('Rp', 'Rp ')})
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone bg-white p-4">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={maxQuantity}
          disabled={soldOut}
        />
        <div className="text-sm">
          <p className="text-charcoal/70">Subtotal</p>
          <p className="font-semibold text-forest">{formatRupiah(total)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={handleAdd} disabled={soldOut}>
          {soldOut ? 'Stok habis' : 'Tambah ke Keranjang'}
        </Button>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border border-[#128C7E] px-6 font-semibold text-[#0f7a6e] transition hover:bg-[#128C7E]/10"
          >
            <MessageCircle aria-hidden className="h-4 w-4" />
            Tanya stok via WhatsApp
          </a>
        ) : (
          <span className="inline-flex items-center rounded-xl border border-dashed border-sand bg-stone/50 px-4 text-xs text-charcoal/80">
            Nomor WhatsApp belum diatur pemilik toko.
          </span>
        )}
      </div>

      <ul className="space-y-2 text-sm text-charcoal/80">
        <li className="flex items-start gap-2">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
          Pesanan dikonfirmasi admin sebelum diproses; stok dipotong setelah dikonfirmasi.
        </li>
        <li className="flex items-start gap-2">
          <Truck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
          {storeAddress
            ? `Bisa ambil sendiri di ${storeAddress}, atau dikirim sesuai alamat Anda.`
            : 'Bisa ambil sendiri di toko atau dikirim; alamat toko belum diatur pemilik usaha.'}
        </li>
      </ul>
    </div>
  );
}

export default ProductPurchasePanel;
