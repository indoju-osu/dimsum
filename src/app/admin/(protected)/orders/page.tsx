import Link from 'next/link';
import { AdminCard, AdminPageHeader, TableWrap, Td, Th } from '@/components/admin/AdminUI';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, Pagination } from '@/components/ui/Misc';
import { listOrders } from '@/lib/admin-data';
import { FULFILLMENT_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE, ORDER_STATUS_VALUES } from '@/lib/constants';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { z } from 'zod';

export const metadata = { title: 'Pesanan' };

const querySchema = z.object({
  search: z.string().optional().default(''),
  status: z.union([z.enum(ORDER_STATUS_VALUES), z.literal('all')]).default('all'),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Daftar pesanan dengan filter status dan pencarian nomor/nama pelanggan. */
export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const parsed = querySchema.safeParse({ search: raw.search, status: raw.status, page: raw.page });
  const query = parsed.success ? parsed.data : { search: '', status: 'all' as const, page: 1 };

  const result = await listOrders({ search: query.search, status: query.status, page: query.page });

  function buildHref(page: number): string {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status !== 'all') params.set('status', query.status);
    if (page > 1) params.set('page', String(page));
    const suffix = params.toString();
    return suffix ? `/admin/orders?${suffix}` : '/admin/orders';
  }

  const tabs: { value: 'all' | (typeof ORDER_STATUS_VALUES)[number]; label: string }[] = [
    { value: 'all', label: 'Semua' },
    ...ORDER_STATUS_VALUES.map((value) => ({ value, label: ORDER_STATUS_LABEL[value] })),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pesanan"
        description={`${result.total} pesanan ditemukan. Ubah status di halaman detail untuk memproses stok otomatis.`}
      />

      <AdminCard title="Filter">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const params = new URLSearchParams();
              if (query.search) params.set('search', query.search);
              if (tab.value !== 'all') params.set('status', tab.value);
              const suffix = params.toString();
              const href = suffix ? `/admin/orders?${suffix}` : '/admin/orders';
              const active = query.status === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-[44px] items-center rounded-xl border px-3.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-forest bg-forest text-white'
                      : 'border-stone bg-white text-forest hover:border-olive',
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form method="get" action="/admin/orders" className="flex flex-wrap items-end gap-3">
            {query.status !== 'all' ? <input type="hidden" name="status" value={query.status} /> : null}
            <div className="min-w-[240px] flex-1 space-y-1.5">
              <label htmlFor="search" className="block text-sm font-medium text-forest">
                Cari nomor pesanan / nama / telepon
              </label>
              <input
                id="search"
                name="search"
                defaultValue={query.search}
                className="min-h-[44px] w-full rounded-xl border border-stone bg-white px-3.5 text-sm text-charcoal focus:border-olive focus:outline-none focus:ring-2 focus:ring-forest/30"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1d2a18]"
            >
              Cari
            </button>
            <ButtonLink href="/admin/orders" variant="outline">
              Reset
            </ButtonLink>
          </form>
        </div>
      </AdminCard>

      <AdminCard title="Daftar pesanan">
        {result.items.length === 0 ? (
          <EmptyState
            title="Belum ada pesanan"
            description="Pesanan yang dibuat pelanggan akan tampil di sini."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>No. Pesanan</Th>
                  <Th>Pelanggan</Th>
                  <Th>Pemenuhan</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Waktu</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((order) => (
                  <tr key={order.id}>
                    <Td className="font-medium text-forest">
                      {order.orderNumber}
                      <span className="block text-xs text-charcoal/60">
                        {order.items.length} item
                      </span>
                    </Td>
                    <Td>
                      {order.customerName}
                      <span className="block text-xs text-charcoal/70">{order.customerPhone}</span>
                    </Td>
                    <Td>{FULFILLMENT_LABEL[order.fulfillment]}</Td>
                    <Td className="font-medium text-forest">{formatRupiah(order.total)}</Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          ORDER_STATUS_TONE[order.status],
                        )}
                      >
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                    </Td>
                    <Td className="text-xs text-charcoal/75">{formatDateTime(order.createdAt)}</Td>
                    <Td className="text-right">
                      <ButtonLink href={`/admin/orders/${order.id}`} variant="outline" size="sm">
                        Detail
                      </ButtonLink>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} className="mt-6" />
          </>
        )}
      </AdminCard>
    </div>
  );
}
