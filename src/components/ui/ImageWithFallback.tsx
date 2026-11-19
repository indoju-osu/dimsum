'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const FALLBACK_IMAGE = '/images/fallback-product.webp';

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  /** Wajib `relative` saat memakai mode fill. */
  wrapperClassName?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
};

/**
 * Gambar produk/kategori/artikel.
 *
 * - Path lokal (/images/...) memakai next/image (optimasi WebP/AVIF + lazy load).
 * - URL eksternal dirender sebagai <img> biasa supaya admin bebas memakai host
 *   mana pun tanpa harus menambah remotePatterns (CSP img-src https: aktif).
 * - Bila gambar gagal dimuat, tampilkan /images/fallback-product.webp.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  wrapperClassName,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
  fill = true,
  width,
  height,
}: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = failed || !src ? FALLBACK_IMAGE : src;
  const isLocal = resolved.startsWith('/');

  const handleError = () => setFailed(true);

  if (!isLocal) {
    if (fill) {
      return (
        <span className={cn('relative block h-full w-full', wrapperClassName)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolved}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleError}
            className={cn('h-full w-full object-cover', className)}
          />
        </span>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        width={width ?? 900}
        height={height ?? 900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleError}
        className={cn('object-cover', className)}
      />
    );
  }

  if (fill) {
    return (
      <span className={cn('relative block h-full w-full', wrapperClassName)}>
        <Image
          src={resolved}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={handleError}
          className={cn('object-cover', className)}
        />
      </span>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width ?? 900}
      height={height ?? 900}
      sizes={sizes}
      priority={priority}
      onError={handleError}
      className={cn('object-cover', className)}
    />
  );
}

export default ImageWithFallback;
