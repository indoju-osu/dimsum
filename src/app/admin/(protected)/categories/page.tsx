import { AdminPageHeader } from '@/components/admin/AdminUI';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { getCategories } from '@/lib/database';

export const metadata = { title: 'Kategori' };

/** Halaman manajemen kategori produk. */
export default async function AdminCategoriesPage() {
  const categories = await getCategories({ includeInactive: true });

  return (
    <div>
      <AdminPageHeader
        title="Kategori"
        description="Kategori dipakai untuk filter katalog. Kategori yang masih memiliki produk tidak dapat dihapus."
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
