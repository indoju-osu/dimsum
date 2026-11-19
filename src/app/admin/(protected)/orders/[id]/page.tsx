import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AdminCard, AdminPageHeader, TableWrap, Td, Th } from '@/components/admin/AdminUI';
import { OrderStatusControl } from '@/components/admin/OrderStatusControl';
import { ButtonLink } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { getOrderById } from '@/lib/admin-data';
import { getStoreSettings } from '@/lib/settings';
import { FULFILLMENT_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/constants';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Detail Pesanan' };

type Params = Promise<{ id: string }>;

/** Detail pesanan: data pelanggan, item, total, dan kontrol perubahan status. */
export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderById(id), getStoreSettings()]);

  if (!order) notFound();

  const customerDigits = order.customerPhone.replace(/[^\d]/g, '');
  const followUpMessage = `Halo ${order.customerName}, terima kasih sudah memesan di ${settings.brandName}. Pesanan ${order.orderNumber} sedang kami proses.`;
  const followUpUrl =
    customerDigits.length >= 9
      ? `https://wa.me/${customerDigits}?text=${encodeURIComponent(followUpMessage)}`
      : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Pesanan"
        title={order.orderNumber}
        description={`Dibuat ${formatDateTime(order.createdAt)} · diperbarui ${formatDateTime(order.updatedAt)}`}
        actions={
          <>
            <ButtonLink href="/admin/orders" variant="outline" size="sm">
              Kembali ke daftar
            </ButtonLink>
            {followUpUrl ? (
              <ButtonLink
                href={followUpUrl}
                variant="whatsapp"
                size="sm"
                external
              >
                Hubungi pelanggan
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <AdminCard title="Item pesanan">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Produk</Th>
                  <Th>Harga satuan</Th>
                  <Th>Jumlah</Th>
                  <Th className="text-right">Subtotal</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone">
                          <ImageWithFallback src={item.image} alt={item.productName} sizes="48px" />
                        </div>
                        <div>
                          <p className="font-medium text-forest">{item.productName}</p>
                          {item.variantName ? (
                            <p className="text-xs text-charcoal/70">Varian: {item.variantName}</p>
                          ) : null}
                          {item.productId ? (
                            <Link
                              href={`/admin/products/${item.productId}`}
                              className="link-underline text-xs font-medium text-forest"
                            >
                              Buka produk
                            </Link>
                          ) : (
                            <span className="text-xs text-charcoal/60">
                              Produk sudah dihapus dari katalog
                            </span>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>{formatRupiah(item.unitPrice)}</Td>
                    <Td>{item.quantity}</Td>
                    <Td className="text-right font-medium text-forest">
                      {formatRupiah(item.subtotal)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <dl className="mt-5 space-y-2 border-t border-stone pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-charcoal/80">Subtotal</dt>
                <dd className="font-medium text-charcoal">{formatRupiah(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal/80">Ongkos kirim</dt>
                <dd className="font-medium text-charcoal">
                  {order.shippingCost > 0 ? formatRupiah(order.shippingCost) : 'Tidak ada'}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone pt-2 text-base">
                <dt className="font-semibold text-forest">Total</dt>
                <dd className="font-semibold text-forest">{formatRupiah(order.total)}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Data pelanggan">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70">
                  Nama
                </dt>
                <dd className="text-sm text-charcoal">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70">
                  WhatsApp
                </dt>
                <dd className="text-sm text-charcoal">{order.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70">
                  Pemenuhan
                </dt>
                <dd className="text-sm text-charcoal">{FULFILLMENT_LABEL[order.fulfillment]}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70">
                  Alamat
                </dt>
                <dd className="text-sm text-charcoal">{order.address || 'Ambil sendiri di toko'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70">
                  Catatan pelanggan
                </dt>
                <dd className="whitespace-pre-line text-sm text-charcoal">
                  {order.note || 'Tidak ada catatan.'}
                </dd>
              </div>
            </dl>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Status saat ini">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
                ORDER_STATUS_TONE[order.status],
              )}
            >
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            <p className="mt-3 text-xs text-charcoal/70">
              Pesanan ini {order.stockCommitted ? 'sudah' : 'belum'} memotong stok.
            </p>
          </AdminCard>

          <AdminCard title="Ubah status">
            <OrderStatusControl
              orderId={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
              stockCommitted={order.stockCommitted}
            />
          </AdminCard>

          <AdminCard title="Ringkasan pesanan">
            <ul className="space-y-2 text-sm text-charcoal/85">
              <li>{order.items.length} jenis produk</li>
              <li>
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} total pcs
              </li>
              <li>Total {formatRupiah(order.total)}</li>
            </ul>
            <p className="mt-4 text-xs text-charcoal/60">
              Nomor pesanan dibuat otomatis dan tidak dapat diubah.
            </p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
