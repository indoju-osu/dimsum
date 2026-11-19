'use client';

import { useState } from 'react';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { cn } from '@/lib/utils';

/**
 * Galeri produk: gambar utama rasio 1:1 dan daftar thumbnail.
 * Thumbnail merupakan tombol sehingga dapat dioperasikan dengan keyboard.
 */
export function ProductGallery({
  images,
  alt,
  priority = false,
}: {
  images: { id: string; url: string; alt: string | null }[];
  alt: string;
  priority?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-stone bg-stone/50">
        <ImageWithFallback src={null} alt={alt} priority={priority} sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-stone bg-stone/50">
        <ImageWithFallback
          src={active.url}
          alt={active.alt ?? alt}
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-3 overflow-x-auto pb-1 no-scrollbar" aria-label="Galeri foto produk">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Lihat foto ${index + 1}`}
                aria-current={index === activeIndex}
                className={cn(
                  'relative h-20 w-20 overflow-hidden rounded-2xl border-2 bg-white transition',
                  index === activeIndex ? 'border-forest' : 'border-stone hover:border-olive',
                )}
              >
                <ImageWithFallback
                  src={image.url}
                  alt={image.alt ?? `${alt} foto ${index + 1}`}
                  sizes="80px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default ProductGallery;
