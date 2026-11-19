import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { AdminCard, AdminPageHeader, StatCard, TableWrap, Td, Th } from '@/components/admin/AdminUI';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { ButtonLink } from '@/components/ui/Button';
import { getDashboardStats } from '@/lib/admin-data';
import { listRecentActivity } from '@/lib/activity';
import { getStoreSettings, missingConfigKeys } from '@/lib/settings';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/constants';
import { formatDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };

/** Dashboard admin: ringkasan penjualan, stok, dan pesanan terbaru. */
export default async function AdminDashboardPage() {
  const [stats, activity, settings] = await Promise.all([
    getDashboardStats(),
    listRecentActivity(8),
    getStoreSettings(),
  ]);

  const missing = missingConfigKeys(settings);
  const maxSales = Math.max(1, ...stats.salesByDay.map((day) => day.total));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Ringkasan"
        title={`Selamat datang di dashboard ${settings.brandName}`}
        description="Pantau penjualan, stok, dan pesanan yang menunggu konfirmasi. Data di bawah dihitung langsung dari database."
        actions={
          <>
            <ButtonLink href="/admin/orders" variant="secondary" size="sm">
              Kelola pesanan
            </ButtonLink>
            <ButtonLink href="/admin/products/new" size="sm">
              Tambah produk
            </ButtonLink>
          </>
        }
      />

      {missing.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-harvest/50 bg-harvest/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
            <div className="text-sm text-forest">
              <p className="font-semibold">Beberapa data toko belum lengkap</p>
              <p className="text-charcoal/80">
                Belum diisi: {missing.join(', ')}. Lengkapi di halaman Pengaturan Toko. Nomor
                WhatsApp tidak akan pernah dikarang oleh sistem.
              </p>
            </div>
          </div>
          <ButtonLink href="/admin/settings" size="sm" className="shrink-0">
            Buka pengaturan
          </ButtonLink>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-olive/40 bg-olive/10 px-5 py-4 text-sm text-forest">
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-olive" />
          <p>Pengaturan toko sudah lengkap. Pelanggan dapat menghubungi Anda via WhatsApp.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total pesanan"
          value={String(stats.orderCount)}
          hint={`${stats.pendingOrderCount} menunggu konfirmasi`}
        />
        <StatCard
          label="Pendapatan (pesanan selesai)"
          value={formatRupiah(stats.revenueTotal)}
          hint={`Bulan ini ${formatRupiah(stats.revenueThisMonth)}`}
          tone="success"
        />
        <StatCard
          label="Produk aktif"
          value={String(stats.publishedProductCount)}
          hint={`${stats.productCount} total produk · ${stats.categoryCount} kategori`}
        />
        <StatCard
          label="Perlu perhatian"
          value={String(stats.lowStockCount + stats.outOfStockCount)}
          hint={`${stats.outOfStockCount} stok habis · ${stats.lowStockCount} stok menipis`}
          tone={stats.lowStockCount + stats.outOfStockCount > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard
          title="Penjualan 7 hari terakhir"
          description="Total nilai pesanan yang dibuat tiap hari (semua status kecuali dibatalkan)."
        >
          {stats.salesByDay.length === 0 ? (
            <EmptyState
              title="Belum ada data penjualan"
              description="Grafik akan terisi setelah ada pesanan masuk."
            />
          ) : (
            <ul className="space-y-3">
              {stats.salesByDay.map((day) => (
                <li key={day.date} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal/80">{formatDate(day.date)}</span>
                    <span className="font-semibold text-forest">
                      {formatRupiah(day.total)}{' '}
                      <span className="text-xs font-normal text-charcoal/70">
                        ({day.orders} pesanan)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone/70">
                    <div
                      className="h-full rounded-full bg-olive"
                      style={{ width: `${Math.max(4, (day.total / maxSales) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard
          title="Stok perlu ditambah"
          description={`Produk dengan stok ≤ 5 pcs.`}
        >
          {stats.lowStockProducts.length === 0 ? (
            <EmptyState title="Semua stok aman" description="Tidak ada produk yang menipis saat ini." />
          ) : (
            <ul className="divide-y divide-stone/70">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="link-underline text-sm font-medium text-forest"
                  >
                    {product.name}
                  </Link>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      product.stock <= 0
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-harvest/50 bg-harvest/15 text-forest',
                    )}
                  >
                    {product.stock <= 0 ? 'Habis' : `${product.stock} pcs`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard
        title="Pesanan terbaru"
        description="Lima pesanan terakhir yang masuk."
        actions={<ButtonLink href="/admin/orders" variant="outline" size="sm">Lihat semua</ButtonLink>}
      >
        {stats.recentOrders.length === 0 ? (
          <EmptyState title="Belum ada pesanan" description="Pesanan baru akan muncul di sini." />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>No. Pesanan</Th>
                <Th>Pelanggan</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <Td className="font-medium text-forest">{order.orderNumber}</Td>
                  <Td>
                    {order.customerName}
                    <span className="block text-xs text-charcoal/70">{order.customerPhone}</span>
                  </Td>
                  <Td>{formatRupiah(order.total)}</Td>
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
                  <Td className="text-right">
                    <ButtonLink href={`/admin/orders/${order.id}`} variant="outline" size="sm">
                      Detail
                    </ButtonLink>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Produk terlaris" description="Berdasarkan jumlah terjual.">
          {stats.bestSellers.length === 0 ? (
            <EmptyState title="Belum ada penjualan" />
          ) : (
            <ul className="divide-y divide-stone/70">
              {stats.bestSellers.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="link-underline text-sm font-medium text-forest"
                  >
                    {product.name}
                  </Link>
                  <span className="text-sm text-charcoal/80">{product.soldCount} terjual</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard
          title="Aktivitas terbaru"
          description="Catatan tindakan admin yang tercatat sistem."
        >
          {activity.length === 0 ? (
            <EmptyState title="Belum ada aktivitas" />
          ) : (
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                  <div>
                    <p className="text-charcoal">{item.description}</p>
                    <p className="text-xs text-charcoal/65">
                      {formatDate(item.createdAt)} · {item.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Ringkasan konten">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge tone="neutral">{stats.articleCount} artikel</Badge>
          <Badge tone="neutral">{stats.draftArticleCount} draft</Badge>
          <Badge tone="neutral">{stats.testimonialCount} testimoni</Badge>
          <Badge tone="neutral">{stats.completedOrderCount} pesanan selesai</Badge>
          {stats.averageRating !== null ? (
            <Badge tone="olive">Rata-rata rating {stats.averageRating.toFixed(1)}/5</Badge>
          ) : null}
        </div>
      </AdminCard>
    </div>
  );
}
