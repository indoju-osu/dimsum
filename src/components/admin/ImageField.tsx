'use client';

import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Field, Input } from '@/components/ui/FormControls';
import { cn } from '@/lib/utils';

/**
 * Foto bawaan yang tersedia di /public/images. Admin bisa memilih salah satu
 * atau menempelkan URL https sendiri.
 *
 * Catatan: aplikasi TIDAK mengunggah berkas ke filesystem karena deployment
 * Vercel bersifat read-only. Untuk memakai foto asli toko, unggah ke layanan
 * penyimpanan/gambar lalu tempelkan URL-nya di sini.
 */
export const IMAGE_LIBRARY: { group: string; items: { label: string; value: string }[] }[] = [
  {
    group: 'Produk',
    items: [
      { label: 'Dimsum ayam original', value: '/images/products/dimsum-ayam-original.webp' },
      { label: 'Dimsum ayam jamur', value: '/images/products/dimsum-ayam-jamur.webp' },
      { label: 'Dimsum udang premium', value: '/images/products/dimsum-udang-premium.webp' },
      { label: 'Dimsum crabstick', value: '/images/products/dimsum-crabstick.webp' },
      { label: 'Dimsum mozzarella', value: '/images/products/dimsum-mozzarella.webp' },
      { label: 'Dimsum mentai', value: '/images/products/dimsum-mentai.webp' },
      { label: 'Dimsum beef', value: '/images/products/dimsum-beef.webp' },
      { label: 'Dimsum nori', value: '/images/products/dimsum-nori.webp' },
      { label: 'Frozen original 10 pcs', value: '/images/products/dimsum-frozen-original.webp' },
      { label: 'Frozen premium 20 pcs', value: '/images/products/dimsum-frozen-premium.webp' },
      { label: 'Paket dimsum mix', value: '/images/products/paket-dimsum-mix.webp' },
      { label: 'Paket keluarga', value: '/images/products/paket-keluarga.webp' },
    ],
  },
  {
    group: 'Kategori',
    items: [
      { label: 'Kategori dimsum ayam', value: '/images/categories/dimsum-ayam.webp' },
      { label: 'Kategori dimsum udang', value: '/images/categories/dimsum-udang.webp' },
      { label: 'Kategori dimsum premium', value: '/images/categories/dimsum-premium.webp' },
      { label: 'Kategori dimsum mentai', value: '/images/categories/dimsum-mentai.webp' },
      { label: 'Kategori dimsum frozen', value: '/images/categories/dimsum-frozen.webp' },
      { label: 'Kategori paket hemat', value: '/images/categories/paket-hemat.webp' },
      { label: 'Kategori paket keluarga', value: '/images/categories/paket-keluarga.webp' },
      { label: 'Kategori saus pelengkap', value: '/images/categories/saus-pelengkap.webp' },
    ],
  },
];

const ALL_IMAGES = IMAGE_LIBRARY.flatMap((group) => group.items.map((item) => item.value));

export const IMAGE_LIST_ID = 'daftar-foto-bawaan';

/**
 * Input foto dengan pratinjau, pemilih foto bawaan (<datalist>), dan tombol
 * untuk menempelkan path bawaan.
 */
export function ImageField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  optional = true,
  previewAspect = 'square',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  optional?: boolean;
  previewAspect?: 'square' | 'wide';
}) {
  return (
    <div className="space-y-3">
      <Field label={label} htmlFor={id} hint={hint} error={error} required={!optional}>
        <Input
          id={id}
          value={value}
          list={IMAGE_LIST_ID}
          onChange={(event) => onChange(event.target.value)}
          invalid={Boolean(error)}
          placeholder="/images/products/nama-file.webp atau https://…"
        />
      </Field>

      <datalist id={IMAGE_LIST_ID}>
        {ALL_IMAGES.map((image) => (
          <option key={image} value={image} />
        ))}
      </datalist>

      <div className="flex flex-wrap items-start gap-3">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-stone bg-stone/40',
            previewAspect === 'square' ? 'h-24 w-24' : 'h-20 w-32',
          )}
        >
          <ImageWithFallback src={value || null} alt="Pratinjau foto" sizes="96px" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {IMAGE_LIBRARY[0]?.items.slice(0, 6).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                title={item.label}
                className={cn(
                  'relative h-11 w-11 overflow-hidden rounded-lg border transition',
                  value === item.value
                    ? 'border-forest ring-2 ring-forest/40'
                    : 'border-stone hover:border-olive',
                )}
              >
                <ImageWithFallback src={item.value} alt={item.label} fill sizes="44px" />
              </button>
            ))}
          </div>
          <p className="text-xs text-charcoal/70">
            Pilih dari daftar foto bawaan (mulai mengetik di kolom) atau tempel URL gambar asli dari
            layanan penyimpanan Anda.
          </p>
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="link-underline text-xs font-medium text-forest"
            >
              Kosongkan foto
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ImageField;
