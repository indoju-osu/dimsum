import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStoreSettings } from '@/lib/settings';

/**
 * Layout halaman admin yang sudah login. Sesi diverifikasi ulang di server
 * (middleware hanya pertahanan lapis pertama) dan pengaturan toko dipakai untuk
 * judul sidebar.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const settings = await getStoreSettings();

  const pendingOrderCount = await prisma.order
    .count({ where: { status: 'PENDING_CONFIRMATION' } })
    .catch(() => 0);

  return (
    <AdminShell
      username={session.username}
      brandName={settings.brandName}
      pendingOrderCount={pendingOrderCount}
    >
      {children}
    </AdminShell>
  );
}
