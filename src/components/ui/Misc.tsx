import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/format';

/** Judul bagian dengan eyebrow dan deskripsi opsional. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  return (
    <header
      className={cn(
        'max-w-2xl space-y-3',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Heading className="text-2xl leading-tight sm:text-3xl lg:text-4xl">{title}</Heading>
      {description ? <p className="text-charcoal/80">{description}</p> : null}
    </header>
  );
}

type BadgeTone = 'olive' | 'harvest' | 'forest' | 'sand' | 'danger' | 'neutral';

const BADGE_TONE: Record<BadgeTone, string> = {
  olive: 'border-olive/40 bg-olive/15 text-forest',
  harvest: 'border-harvest/50 bg-harvest/20 text-forest',
  forest: 'border-forest/30 bg-forest/10 text-forest',
  sand: 'border-sand bg-sand/30 text-forest',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-stone bg-white text-charcoal',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        BADGE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className, label = 'Memuat' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-charcoal/80', className)}>
      <span
        aria-hidden
        className="h-5 w-5 animate-spin rounded-full border-2 border-olive border-t-transparent"
      />
      {label}
    </span>
  );
}

/** Bintang rating 1-5 dengan label aksesibilitas. */
export function StarRating({
  rating,
  size = 'sm',
  showValue = true,
  className,
}: {
  rating: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(rating);
  const dimension = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="sr-only">{`Rating ${rating.toFixed(1)} dari 5`}</span>
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((position) => (
          <Star
            key={position}
            className={cn(
              dimension,
              position <= rounded ? 'fill-harvest text-harvest' : 'text-sand',
            )}
          />
        ))}
      </span>
      {showValue ? (
        <span aria-hidden className="text-xs font-semibold text-forest">
          {rating.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'card-surface flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="text-olive">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-forest">{title}</h3>
      {description ? <p className="max-w-md text-sm text-charcoal/80">{description}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-2xl bg-stone/70', className)} />;
}

/** Label harga dengan garis harga asli bila sedang diskon. */
export function PriceTag({
  price,
  discountPrice,
  className,
  size = 'md',
}: {
  price: number;
  discountPrice?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const hasDiscount = Boolean(discountPrice && discountPrice > 0 && discountPrice < price);
  const fontSize =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-semibold text-forest', fontSize)}>
        {formatRupiah(hasDiscount ? discountPrice : price)}
      </span>
      {hasDiscount ? (
        <span className="text-xs text-charcoal/60 line-through">{formatRupiah(price)}</span>
      ) : null}
    </div>
  );
}

/** Paginasi berbasis link (SEO friendly, tanpa JavaScript). */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav aria-label="Navigasi halaman" className={cn('flex items-center justify-center gap-1.5', className)}>
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          'inline-flex min-h-[44px] items-center rounded-xl border border-stone bg-white px-3 text-sm font-medium text-forest transition hover:border-olive',
          page === 1 && 'pointer-events-none opacity-50',
        )}
      >
        Sebelumnya
      </Link>
      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && candidate - previous > 1;
        return (
          <span key={candidate} className="flex items-center gap-1.5">
            {gap ? <span className="px-1 text-charcoal/50">…</span> : null}
            <Link
              href={buildHref(candidate)}
              aria-current={candidate === page ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition',
                candidate === page
                  ? 'border-forest bg-forest text-white'
                  : 'border-stone bg-white text-forest hover:border-olive',
              )}
            >
              {candidate}
            </Link>
          </span>
        );
      })}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          'inline-flex min-h-[44px] items-center rounded-xl border border-stone bg-white px-3 text-sm font-medium text-forest transition hover:border-olive',
          page === totalPages && 'pointer-events-none opacity-50',
        )}
      >
        Berikutnya
      </Link>
    </nav>
  );
}

export default SectionHeading;
