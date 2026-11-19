'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import type { CategorySummary, ProductDetail } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input, Select, SwitchLine, Textarea } from '@/components/ui/FormControls';
import { AdminCard } from '@/components/admin/AdminUI';
import { ImageField } from '@/components/admin/ImageField';
import { GalleryEditor } from '@/components/admin/GalleryEditor';
import { VariantEditor, type VariantDraft } from '@/components/admin/VariantEditor';
import { useToast } from '@/components/ui/Toast';

type FormState = {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  contentLabel: string;
  weightGram: string;
  price: string;
  discountPrice: string;
  isPromo: boolean;
  promoEndsAt: string;
  image: string;
  gallery: string[];
  stock: string;
  ingredients: string;
  servingSuggestion: string;
  storageSuggestion: string;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  variants: VariantDraft[];
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function initialState(product: ProductDetail | null): FormState {
  if (!product) {
    return {
      name: '',
      slug: '',
      categoryId: '',
      shortDescription: '',
      description: '',
      contentLabel: '',
      weightGram: '',
      price: '',
      discountPrice: '',
      isPromo: false,
      promoEndsAt: '',
      image: '',
      gallery: [],
      stock: '0',
      ingredients: '',
      servingSuggestion: '',
      storageSuggestion: '',
      isAvailable: true,
      isBestSeller: false,
      isNewArrival: false,
      isFeatured: false,
      isPublished: true,
      variants: [],
    };
  }

  return {
    name: product.name,
    slug: product.slug,
    categoryId: product.category.id,
    shortDescription: product.shortDescription ?? '',
    description: product.description,
    contentLabel: product.contentLabel,
    weightGram: product.weightGram === null ? '' : String(product.weightGram),
    price: String(product.price),
    discountPrice: product.discountPrice === null ? '' : String(product.discountPrice),
    isPromo: product.isPromo,
    promoEndsAt: toLocalInput(product.promoEndsAt),
    image: product.image,
    gallery: product.gallery.map((item) => item.url),
    stock: String(product.stock),
    ingredients: product.ingredients ?? '',
    servingSuggestion: product.servingSuggestion ?? '',
    storageSuggestion: product.storageSuggestion ?? '',
    isAvailable: product.isAvailable,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    variants: product.variants.map((variant) => ({
      name: variant.name,
      priceAdjustment: String(variant.priceAdjustment),
      isDefault: variant.isDefault,
    })),
  };
}

/**
 * Form tambah/ubah produk.
 *
 * Foto memakai path lokal (/images/...) atau URL https. Tidak ada unggahan
 * berkas karena deployment Vercel bersifat read-only.
 */
export function ProductForm({
  categories,
  product = null,
}: {
  categories: CategorySummary[];
  product?: ProductDetail | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<FormState>(() => initialState(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(product);
  const activeCategories = categories.filter(
    (category) => category.isActive || category.id === state.categoryId,
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (state.name.trim().length < 2) next.name = 'Nama produk minimal 2 karakter.';
    if (!state.categoryId) next.categoryId = 'Kategori wajib dipilih.';
    if (state.description.trim().length < 10) next.description = 'Deskripsi minimal 10 karakter.';
    if (!state.contentLabel.trim()) next.contentLabel = 'Isi kemasan wajib diisi (contoh: 5 pcs).';
    const price = Number(state.price);
    if (!Number.isFinite(price) || price <= 0) next.price = 'Harga harus lebih dari 0.';
    if (state.discountPrice) {
      const discount = Number(state.discountPrice);
      if (!Number.isFinite(discount) || discount <= 0) {
        next.discountPrice = 'Harga promo harus lebih dari 0.';
      } else if (discount >= price) {
        next.discountPrice = 'Harga promo harus lebih kecil dari harga normal.';
      }
    }
    if (!state.image.trim()) next.image = 'Foto utama wajib diisi.';
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Periksa kembali kolom yang ditandai merah.');
      return;
    }

    setSaving(true);

    const payload = {
      name: state.name,
      slug: state.slug || undefined,
      shortDescription: state.shortDescription,
      description: state.description,
      ingredients: state.ingredients,
      servingSuggestion: state.servingSuggestion,
      storageSuggestion: state.storageSuggestion,
      contentLabel: state.contentLabel,
      weightGram: state.weightGram === '' ? null : Number(state.weightGram),
      categoryId: state.categoryId,
      price: state.price,
      discountPrice: state.discountPrice === '' ? null : state.discountPrice,
      isPromo: state.isPromo,
      promoEndsAt: state.promoEndsAt ? new Date(state.promoEndsAt).toISOString() : null,
      image: state.image,
      gallery: state.gallery.filter((url) => url.trim().length > 0),
      stock: state.stock,
      isAvailable: state.isAvailable,
      isBestSeller: state.isBestSeller,
      isNewArrival: state.isNewArrival,
      isFeatured: state.isFeatured,
      isPublished: state.isPublished,
      variants: state.variants
        .filter((variant) => variant.name.trim().length > 0)
        .map((variant) => ({
          name: variant.name,
          priceAdjustment: variant.priceAdjustment === '' ? 0 : Number(variant.priceAdjustment),
          isDefault: variant.isDefault,
        })),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/products/${product?.id}` : '/api/admin/products',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const result: { error?: string; details?: { path: string; message: string }[] } =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.details?.length) {
          const mapped: Record<string, string> = {};
          for (const detail of result.details) {
            const field = detail.path.split('.')[0];
            if (field) mapped[field] = detail.message;
          }
          setErrors(mapped);
        }
        setFormError(result.error ?? 'Gagal menyimpan produk.');
        toast.error('Gagal menyimpan produk', result.error ?? 'Silakan periksa kembali data.');
        return;
      }

      toast.success(
        isEdit ? 'Produk diperbarui' : 'Produk ditambahkan',
        `${state.name} telah disimpan.`,
      );
      router.push('/admin/products');
      router.refresh();
    } catch {
      setFormError('Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  if (activeCategories.length === 0) {
    return (
      <AdminCard title="Kategori belum tersedia">
        <p className="text-sm text-charcoal/80">
          Buat minimal satu kategori terlebih dahulu sebelum menambahkan produk.
        </p>
        <div className="mt-4">
          <ButtonLink href="/admin/categories">Kelola kategori</ButtonLink>
        </div>
      </AdminCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {formError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </p>
      ) : null}

      <AdminCard title="Informasi dasar" description="Nama, kategori, dan deskripsi produk.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Nama produk" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={state.name}
              onChange={(event) => update('name', event.target.value)}
              invalid={Boolean(errors.name)}
              placeholder="Dimsum Ayam Original 5 pcs"
            />
          </Field>

          <Field
            label="Slug URL"
            htmlFor="slug"
            hint="Kosongkan untuk membuat otomatis dari nama produk."
            error={errors.slug}
          >
            <Input
              id="slug"
              value={state.slug}
              onChange={(event) => update('slug', event.target.value)}
              invalid={Boolean(errors.slug)}
              placeholder="dimsum-ayam-original-5-pcs"
            />
          </Field>

          <Field label="Kategori" htmlFor="categoryId" required error={errors.categoryId}>
            <Select
              id="categoryId"
              value={state.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
              invalid={Boolean(errors.categoryId)}
            >
              <option value="">Pilih kategori…</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {!category.isActive ? ' (nonaktif)' : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Isi kemasan"
            htmlFor="contentLabel"
            required
            error={errors.contentLabel}
            hint="Contoh: 5 pcs, 250 gram, 1 pack."
          >
            <Input
              id="contentLabel"
              value={state.contentLabel}
              onChange={(event) => update('contentLabel', event.target.value)}
              invalid={Boolean(errors.contentLabel)}
              placeholder="5 pcs"
            />
          </Field>

          <Field
            label="Deskripsi singkat"
            htmlFor="shortDescription"
            hint="Tampil pada kartu produk (maksimal 200 karakter)."
            className="lg:col-span-2"
            error={errors.shortDescription}
          >
            <Textarea
              id="shortDescription"
              rows={2}
              value={state.shortDescription}
              onChange={(event) => update('shortDescription', event.target.value)}
              invalid={Boolean(errors.shortDescription)}
            />
          </Field>

          <Field
            label="Deskripsi lengkap"
            htmlFor="description"
            required
            className="lg:col-span-2"
            error={errors.description}
          >
            <Textarea
              id="description"
              rows={6}
              value={state.description}
              onChange={(event) => update('description', event.target.value)}
              invalid={Boolean(errors.description)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Harga & stok" description="Isi angka tanpa titik, contoh 25000.">
        <div className="grid gap-5 lg:grid-cols-3">
          <Field label="Harga normal (Rp)" htmlFor="price" required error={errors.price}>
            <Input
              id="price"
              inputMode="numeric"
              value={state.price}
              onChange={(event) => update('price', event.target.value)}
              invalid={Boolean(errors.price)}
              placeholder="25000"
            />
          </Field>

          <Field
            label="Harga promo (Rp)"
            htmlFor="discountPrice"
            hint="Kosongkan bila tidak ada promo."
            error={errors.discountPrice}
          >
            <Input
              id="discountPrice"
              inputMode="numeric"
              value={state.discountPrice}
              onChange={(event) => update('discountPrice', event.target.value)}
              invalid={Boolean(errors.discountPrice)}
              placeholder="21000"
            />
          </Field>

          <Field label="Stok (pcs)" htmlFor="stock" error={errors.stock}>
            <Input
              id="stock"
              inputMode="numeric"
              value={state.stock}
              onChange={(event) => update('stock', event.target.value)}
              invalid={Boolean(errors.stock)}
            />
          </Field>

          <Field label="Berat (gram)" htmlFor="weightGram" hint="Opsional." error={errors.weightGram}>
            <Input
              id="weightGram"
              inputMode="numeric"
              value={state.weightGram}
              onChange={(event) => update('weightGram', event.target.value)}
              invalid={Boolean(errors.weightGram)}
              placeholder="200"
            />
          </Field>

          <Field
            label="Promo berakhir"
            htmlFor="promoEndsAt"
            hint="Opsional. Kosong berarti tanpa batas waktu."
            error={errors.promoEndsAt}
          >
            <Input
              id="promoEndsAt"
              type="datetime-local"
              value={state.promoEndsAt}
              onChange={(event) => update('promoEndsAt', event.target.value)}
              invalid={Boolean(errors.promoEndsAt)}
            />
          </Field>

          <div className="lg:col-span-3">
            <SwitchLine
              id="isPromo"
              label="Tandai sebagai produk promo"
              description="Badge promo tampil bila harga promo diisi."
              checked={state.isPromo}
              onChange={(event) => update('isPromo', event.target.checked)}
            />
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Foto produk"
        description="Foto utama tampil di kartu produk (rasio 1:1). Galeri tampil di halaman detail."
      >
        <div className="space-y-6">
          <ImageField
            id="image"
            label="Foto utama"
            value={state.image}
            onChange={(value) => update('image', value)}
            error={errors.image}
            optional={false}
            hint="Pilih dari daftar foto bawaan atau tempel URL gambar."
          />

          <div className="border-t border-stone pt-5">
            <p className="mb-3 text-sm font-medium text-forest">Foto galeri (maksimal 6)</p>
            <GalleryEditor urls={state.gallery} onChange={(urls) => update('gallery', urls)} />
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Varian produk" description="Opsional. Selisih harga boleh negatif.">
        <VariantEditor variants={state.variants} onChange={(variants) => update('variants', variants)} />
      </AdminCard>

      <AdminCard
        title="Detail tambahan"
        description="Semua kolom opsional. Kosongkan bila belum ada informasi resmi dari dapur produksi."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <Field label="Komposisi / bahan" htmlFor="ingredients" error={errors.ingredients}>
            <Textarea
              id="ingredients"
              rows={4}
              value={state.ingredients}
              onChange={(event) => update('ingredients', event.target.value)}
              invalid={Boolean(errors.ingredients)}
              placeholder="Ayam, tepung, bumbu…"
            />
          </Field>
          <Field label="Saran penyajian" htmlFor="servingSuggestion" error={errors.servingSuggestion}>
            <Textarea
              id="servingSuggestion"
              rows={4}
              value={state.servingSuggestion}
              onChange={(event) => update('servingSuggestion', event.target.value)}
              invalid={Boolean(errors.servingSuggestion)}
              placeholder="Kukus 8-10 menit…"
            />
          </Field>
          <Field label="Saran penyimpanan" htmlFor="storageSuggestion" error={errors.storageSuggestion}>
            <Textarea
              id="storageSuggestion"
              rows={4}
              value={state.storageSuggestion}
              onChange={(event) => update('storageSuggestion', event.target.value)}
              invalid={Boolean(errors.storageSuggestion)}
              placeholder="Simpan di freezer…"
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Visibilitas" description="Atur di mana produk tampil di katalog publik.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchLine
            id="isPublished"
            label="Tampilkan di katalog"
            description="Matikan untuk menyimpan sebagai draft."
            checked={state.isPublished}
            onChange={(event) => update('isPublished', event.target.checked)}
          />
          <SwitchLine
            id="isAvailable"
            label="Tersedia untuk dipesan"
            description="Stok habis otomatis ditandai tidak tersedia."
            checked={state.isAvailable}
            onChange={(event) => update('isAvailable', event.target.checked)}
          />
          <SwitchLine
            id="isFeatured"
            label="Tampilkan sebagai produk unggulan"
            description="Muncul di seksi Favorit Pelanggan pada beranda."
            checked={state.isFeatured}
            onChange={(event) => update('isFeatured', event.target.checked)}
          />
          <SwitchLine
            id="isBestSeller"
            label="Tandai sebagai terlaris"
            description="Badge Terlaris pada kartu produk."
            checked={state.isBestSeller}
            onChange={(event) => update('isBestSeller', event.target.checked)}
          />
          <SwitchLine
            id="isNewArrival"
            label="Tandai sebagai produk baru"
            description="Badge Baru pada kartu produk."
            checked={state.isNewArrival}
            onChange={(event) => update('isNewArrival', event.target.checked)}
          />
        </div>
      </AdminCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={saving}>
          <Save aria-hidden className="h-5 w-5" />
          {saving ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Simpan produk'}
        </Button>
        <ButtonLink href="/admin/products" variant="outline" size="lg">
          Batal
        </ButtonLink>
        {isEdit && product?.slug ? (
          <ButtonLink
            href={`/products/${product.slug}`}
            variant="ghost"
            size="lg"
            external
          >
            Lihat di toko
          </ButtonLink>
        ) : null}
      </div>

    </form>
  );
}

export default ProductForm;
