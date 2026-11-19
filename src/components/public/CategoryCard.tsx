import Link from 'next/link';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import type { CategorySummary } from '@/types';

/** Kartu kategori: gambar 1:1 dengan aksen overlay dan jumlah produk. */
export function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-3xl border border-stone bg-forest shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card"
    >
      <ImageWithFallback
        src={category.image}
        alt={`Foto ilustrasi kategori ${category.name}`}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
        className="absolute inset-0 opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
      />
      <div className="relative z-10 bg-gradient-to-t from-forest/90 via-forest/40 to-transparent p-4">
        <h3 className="text-base font-semibold text-white">{category.name}</h3>
        {category.productCount !== undefined ? (
          <p className="mt-0.5 text-xs text-white/85">{category.productCount} produk</p>
        ) : null}
      </div>
    </Link>
  );
}

export default CategoryCard;
