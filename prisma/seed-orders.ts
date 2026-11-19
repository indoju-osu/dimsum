/**
 * Data seed: pesanan contoh (data demo).
 *
 * Dipakai bersama oleh `prisma/seed.ts` (seed penuh) dan `src/lib/demo-reset.ts`
 * (tombol "Reset data demo" pada dashboard admin), supaya hanya ada satu
 * sumber data demo.
 */

export type DemoOrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED';

export type DemoOrder = {
  customerName: string;
  customerPhone: string;
  address: string;
  fulfillment: 'PICKUP' | 'DELIVERY';
  status: DemoOrderStatus;
  items: { slug: string; quantity: number; variantName?: string }[];
  daysAgo: number;
};

/** Semua pelanggan demo memakai nomor 6280000000xx dan catatan [DATA DEMO]. */
export const DEMO_CUSTOMER_PHONE_PREFIX = '62800000000';
export const DEMO_ORDER_NOTE_PREFIX = '[DATA DEMO]';

export const demoOrders: DemoOrder[] = [
  {
    customerName: 'Pelanggan Demo 1',
    customerPhone: '6280000000001',
    address: 'Alamat contoh - bukan alamat asli',
    fulfillment: 'PICKUP',
    status: 'PENDING_CONFIRMATION',
    items: [{ slug: 'dimsum-ayam-original-5-pcs', quantity: 2, variantName: 'Kukus' }],
    daysAgo: 0,
  },
  {
    customerName: 'Pelanggan Demo 2',
    customerPhone: '6280000000002',
    address: 'Alamat contoh - bukan alamat asli',
    fulfillment: 'DELIVERY',
    status: 'PROCESSING',
    items: [
      { slug: 'dimsum-mentai-5-pcs', quantity: 1, variantName: 'Original' },
      { slug: 'paket-dimsum-mix-15-pcs', quantity: 1, variantName: 'Kukus' },
    ],
    daysAgo: 1,
  },
  {
    customerName: 'Pelanggan Demo 3',
    customerPhone: '6280000000003',
    address: 'Alamat contoh - bukan alamat asli',
    fulfillment: 'DELIVERY',
    status: 'COMPLETED',
    items: [{ slug: 'paket-keluarga-30-pcs', quantity: 1, variantName: 'Kukus' }],
    daysAgo: 4,
  },
  {
    customerName: 'Pelanggan Demo 4',
    customerPhone: '6280000000004',
    address: 'Alamat contoh - bukan alamat asli',
    fulfillment: 'PICKUP',
    status: 'CANCELLED',
    items: [{ slug: 'dimsum-frozen-original-10-pcs', quantity: 2, variantName: 'Paket 10 pcs' }],
    daysAgo: 6,
  },
];
