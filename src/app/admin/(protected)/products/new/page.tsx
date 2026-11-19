import { AdminPageHeader } from '@/components/admin/AdminUI';
import { ProductForm } from '@/components/admin/ProductForm';
import { getCategories } from '@/lib/database';

export const metadata = { title: 'Tambah Produk' };

/** Halaman tambah produk baru. */
export default async function NewProductPage() {
  const categories = await getCategories({ includeInactive: true });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Produk"
        title="Tambah produk baru"
        description="Produk yang disimpan akan langsung tampil di katalog bila status tayang diaktifkan."
      />
      <ProductForm categories={categories} />
    </div>
  );
}
