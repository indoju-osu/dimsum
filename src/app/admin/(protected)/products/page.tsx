import { AdminCard, AdminPageHeader } from '@/components/admin/AdminUI';
import { ProductsTable } from '@/components/admin/ProductsTable';
import { ButtonLink } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Misc';
import { listAdminProducts } from '@/lib/admin-data';
import { getCategories } from '@/lib/database';
import { adminProductQuerySchema } from '@/lib/validation';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants';

export const metadata = { title: 'Produk' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Daftar produk dengan pencarian dan filter. Filter dikirim lewat query string
 * (form GET) sehingga tetap bekerja tanpa JavaScript, dan hasilnya dibatasi
 * per halaman oleh ADMIN_PAGE_SIZE.
 */
export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const parsed = adminProductQuerySchema.safeParse({
    search: raw.search,
    categoryId: raw.categoryId,
    status: raw.status,
    stockStatus: raw.stockStatus,
    page: raw.page,
  });
  const query = parsed.success
    ? parsed.data
    : { search: '', categoryId: '', status: 'all' as const, stockStatus: 'all' as const, page: 1 };

  const [result, categories] = await Promise.all([listAdminProducts(query), getCategories({ includeInactive: true })]);

  function buildHref(page: number): string {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.categoryId) params.set('categoryId', query.categoryId);
    if (query.status !== 'all') params.set('status', query.status);
    if (query.stockStatus !== 'all') params.set('stockStatus', query.stockStatus);
    if (page > 1) params.set('page', String(page));
    const suffix = params.toString();
    return suffix ? `/admin/products?${suffix}` : '/admin/products';
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Produk"
        description={`${result.total} produk ditemukan. Ubah stok langsung dari tabel atau buka detail untuk mengubah data lengkap.`}
        actions={<ButtonLink href="/admin/products/new">Tambah produk</ButtonLink>}
      />

      <AdminCard title="Cari & filter">
        <form method="get" action="/admin/products" className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-forest">
              Kata kunci
            </label>
            <input
              id="search"
              name="search"
              defaultValue={query.search}
              placeholder="Nama produk atau kategori…"
              className="min-h-[44px] w-full rounded-xl border border-stone bg-white px-3.5 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="categoryId" className="block text-sm font-medium text-forest">
              Kategori
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={query.categoryId}
              className="min-h-[44px] w-full rounded-xl border border-stone bg-white px-3.5 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? '' : ' (nonaktif)'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium text-forest">
              Status tayang
            </label>
            <select
              id="status"
              name="status"
              defaultValue={query.status}
              className="min-h-[44px] w-full rounded-xl border border-stone bg-white px-3.5 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <option value="all">Semua</option>
              <option value="published">Tampil</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stockStatus" className="block text-sm font-medium text-forest">
              Stok
            </label>
            <select
              id="stockStatus"
              name="stockStatus"
              defaultValue={query.stockStatus}
              className="min-h-[44px] w-full rounded-xl border border-stone bg-white px-3.5 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <option value="all">Semua</option>
              <option value="available">Aman (&gt; {LOW_STOCK_THRESHOLD})</option>
              <option value="low">Menipis (1-{LOW_STOCK_THRESHOLD})</option>
              <option value="out">Habis (0)</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 lg:col-span-4">
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1d2a18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
            >
              Terapkan filter
            </button>
            <ButtonLink href="/admin/products" variant="outline">
              Reset
            </ButtonLink>
          </div>
        </form>
      </AdminCard>

      <AdminCard bodyClassName="px-5 py-4">
        <ProductsTable rows={result.items} />
        <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} className="mt-6" />
      </AdminCard>
    </div>
  );
}
