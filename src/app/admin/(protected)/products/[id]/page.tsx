import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminUI';
import { ProductForm } from '@/components/admin/ProductForm';
import { prisma } from '@/lib/prisma';
import { productInclude, toProductDetail, getCategories } from '@/lib/database';

export const metadata = { title: 'Ubah Produk' };

type Params = Promise<{ id: string }>;

/** Halaman ubah produk. */
export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: productInclude }),
    getCategories({ includeInactive: true }),
  ]);

  if (!product) notFound();

  const detail = toProductDetail(product);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Produk"
        title={`Ubah ${detail.name}`}
        description={`Terakhir diperbarui ${new Date(detail.updatedAt).toLocaleString('id-ID')} · ${detail.soldCount} terjual.`}
      />
      <ProductForm categories={categories} product={detail} />
    </div>
  );
}
