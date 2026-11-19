import Link from 'next/link';
import { Flame, Package, Sparkles } from 'lucide-react';
import { Badge, PriceTag } from '@/components/ui/Misc';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { AddToCartButton } from './AddToCartButton';
import type { ProductListItem } from '@/types';

/**
 * Kartu produk: gambar rasio 1:1, nama, label isi, harga, dan aksi cepat.
 * Informasi foto ilustrasi dicantumkan karena foto belum tentu milik toko.
 */
export function ProductCard({
  product,
  priority = false,
  showQuickAdd = true,
}: {
  product: ProductListItem;
  priority?: boolean;
  showQuickAdd?: boolean;
}) {
  const discountPercent =
    product.discountPrice && product.price > product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-square w-full overflow-hidden bg-stone/60">
        <Link
          href={`/products/${product.slug}`}
          className="block h-full w-full"
          aria-label={`Lihat detail ${product.name}`}
        >
          <ImageWithFallback
            src={product.image}
            alt={`Foto ilustrasi ${product.name}`}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="transition duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discountPercent ? <Badge tone="danger">-{discountPercent}%</Badge> : null}
          {product.isBestSeller ? (
            <Badge tone="harvest">
              <Flame aria-hidden className="h-3 w-3" /> Favorit
            </Badge>
          ) : null}
          {product.isNewArrival ? (
            <Badge tone="olive">
              <Sparkles aria-hidden className="h-3 w-3" /> Baru
            </Badge>
          ) : null}
        </div>
        {product.isSoldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-forest/60">
            <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-forest">
              Stok Habis
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-xs font-semibold uppercase tracking-wide text-olive hover:underline"
          >
            {product.category.name}
          </Link>
          <h3 className="text-base font-semibold leading-snug">
            <Link href={`/products/${product.slug}`} className="hover:text-olive">
              {product.name}
            </Link>
          </h3>
          <p className="inline-flex items-center gap-1 text-xs text-charcoal/70">
            <Package aria-hidden className="h-3.5 w-3.5" />
            {product.contentLabel}
          </p>
        </div>

        {product.shortDescription ? (
          <p className="line-clamp-2 text-sm text-charcoal/80">{product.shortDescription}</p>
        ) : null}

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between gap-2">
            <PriceTag price={product.price} discountPrice={product.discountPrice} />
            <span className="text-xs text-charcoal/70">
              {product.isSoldOut ? 'Habis' : `Stok ${product.stock}`}
            </span>
          </div>
          {showQuickAdd ? (
            <AddToCartButton product={product} size="sm" className="w-full" fullWidth />
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-forest/25 bg-white px-4 text-sm font-semibold text-forest transition hover:border-forest/50 hover:bg-stone/60"
            >
              Lihat Detail
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
