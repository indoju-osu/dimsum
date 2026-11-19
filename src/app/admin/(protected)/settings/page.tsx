import { AdminPageHeader } from '@/components/admin/AdminUI';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { getStoreSettings, missingConfigKeys } from '@/lib/settings';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Pengaturan Toko' };

/** Halaman pengaturan toko: identitas, kontak, pengiriman, SEO, dan reset data demo. */
export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const missing = missingConfigKeys(settings);

  return (
    <div>
      <AdminPageHeader
        title="Pengaturan toko"
        description={
          settings.updatedAt
            ? `Terakhir diperbarui ${formatDateTime(settings.updatedAt)}.`
            : 'Belum pernah diperbarui sejak instalasi.'
        }
      />

      {missing.length > 0 ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-harvest/60 bg-harvest/10 px-4 py-3 text-sm text-forest"
        >
          <p className="font-semibold">Informasi berikut belum diisi:</p>
          <p className="mt-1">{missing.join(' · ')}</p>
          <p className="mt-1 text-xs text-charcoal/75">
            Nilai ini sengaja dikosongkan agar aplikasi tidak menampilkan data bisnis yang tidak benar.
            Isi sesuai data asli toko Anda.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
