'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { IMAGE_LIST_ID } from '@/components/admin/ImageField';

/** Editor galeri foto produk (maksimal 6 foto, urutan sesuai tampilan detail). */
export function GalleryEditor({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {urls.length === 0 ? (
        <p className="text-sm text-charcoal/70">
          Belum ada foto galeri. Foto utama tetap dipakai pada kartu dan halaman detail.
        </p>
      ) : (
        <ul className="space-y-3">
          {urls.map((url, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone bg-stone/40">
                <ImageWithFallback src={url || null} alt={`Foto galeri ${index + 1}`} sizes="56px" />
              </div>
              <label className="sr-only" htmlFor={`gallery-${index}`}>
                URL foto galeri {index + 1}
              </label>
              <Input
                id={`gallery-${index}`}
                list={IMAGE_LIST_ID}
                value={url}
                onChange={(event) =>
                  onChange(urls.map((item, position) => (position === index ? event.target.value : item)))
                }
                placeholder="/images/products/nama-file.webp"
              />
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-red-700 hover:bg-red-50"
                onClick={() => onChange(urls.filter((_, position) => position !== index))}
                aria-label={`Hapus foto galeri ${index + 1}`}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...urls, ''])}
        disabled={urls.length >= 6}
      >
        <Plus aria-hidden className="h-4 w-4" />
        Tambah foto galeri
      </Button>
    </div>
  );
}

export default GalleryEditor;
