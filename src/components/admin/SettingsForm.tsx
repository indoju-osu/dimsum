'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw, Save } from 'lucide-react';
import type { StoreSettingsView } from '@/lib/settings';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/FormControls';
import { AdminCard } from '@/components/admin/AdminUI';
import { ImageField } from '@/components/admin/ImageField';
import { useToast } from '@/components/ui/Toast';

type Draft = {
  brandName: string;
  logo: string;
  favicon: string;
  description: string;
  whatsappNumber: string;
  address: string;
  operatingHours: string;
  instagram: string;
  tiktok: string;
  email: string;
  shippingInfo: string;
  paymentInfo: string;
  shippingCost: string;
  freeShippingMin: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

function toDraft(settings: StoreSettingsView): Draft {
  return {
    brandName: settings.brandName,
    logo: settings.logo ?? '',
    favicon: settings.favicon ?? '',
    description: settings.description,
    whatsappNumber: settings.whatsappNumber,
    address: settings.address ?? '',
    operatingHours: settings.operatingHours ?? '',
    instagram: settings.instagram ?? '',
    tiktok: settings.tiktok ?? '',
    email: settings.email ?? '',
    shippingInfo: settings.shippingInfo ?? '',
    paymentInfo: settings.paymentInfo ?? '',
    shippingCost: String(settings.shippingCost),
    freeShippingMin: settings.freeShippingMin === null ? '' : String(settings.freeShippingMin),
    seoTitle: settings.seoTitle ?? '',
    seoDescription: settings.seoDescription ?? '',
    seoKeywords: settings.seoKeywords ?? '',
  };
}

const CONFIRM_PHRASE = 'RESET DATA DEMO';

/**
 * Form pengaturan toko.
 *
 * Semua informasi bisnis (nomor WhatsApp, alamat, media sosial) sengaja kosong
 * sampai pemilik usaha mengisinya sendiri — aplikasi tidak mengarang data.
 */
export function SettingsForm({ settings }: { settings: StoreSettingsView }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(toDraft(settings));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          shippingCost: draft.shippingCost === '' ? 0 : Number(draft.shippingCost),
          freeShippingMin: draft.freeShippingMin === '' ? null : Number(draft.freeShippingMin),
        }),
      });
      const result: {
        error?: string;
        details?: { path?: string; message: string }[];
      } = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.details?.length) {
          const mapped: Record<string, string> = {};
          for (const detail of result.details) {
            const field = detail.path?.split('.')[0];
            if (field) mapped[field] = detail.message;
          }
          setErrors(mapped);
        }
        toast.error('Gagal menyimpan pengaturan', result.error ?? 'Silakan periksa kembali data.');
        return;
      }

      toast.success('Pengaturan tersimpan', 'Perubahan tampil di situs publik.');
      startTransition(() => router.refresh());
    } catch {
      toast.error('Gagal menyimpan pengaturan', 'Tidak dapat menghubungi server.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (resetPhrase.trim().toUpperCase() !== CONFIRM_PHRASE) {
      toast.error('Konfirmasi tidak cocok', `Ketik ${CONFIRM_PHRASE} untuk melanjutkan.`);
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/admin/settings/reset-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: CONFIRM_PHRASE }),
      });
      const result: { error?: string; message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error('Reset data demo gagal', result.error ?? 'Silakan coba lagi.');
        return;
      }

      toast.success('Data demo direset', result.message ?? 'Katalog demo dipulihkan.');
      setResetOpen(false);
      setResetPhrase('');
      startTransition(() => router.refresh());
    } catch {
      toast.error('Reset data demo gagal', 'Tidak dapat menghubungi server.');
    } finally {
      setResetting(false);
    }
  }

  const whatsappMissing = draft.whatsappNumber.replace(/\D/g, '').length < 9;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {whatsappMissing ? (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-harvest/60 bg-harvest/10 px-4 py-3 text-sm text-forest"
        >
          <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Nomor WhatsApp toko belum diisi. Tombol pemesanan belum dapat membuka WhatsApp sampai
            nomor asli dimasukkan di kolom nomor WhatsApp pada halaman ini.
          </p>
        </div>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-semibold">Beberapa kolom perlu diperbaiki:</p>
          <ul className="mt-1 list-inside list-disc">
            {Object.values(errors).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdminCard title="Identitas toko">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Nama brand" htmlFor="brandName" required error={errors.brandName}>
            <Input
              id="brandName"
              value={draft.brandName}
              onChange={(event) => update('brandName', event.target.value)}
              invalid={Boolean(errors.brandName)}
            />
          </Field>
          <Field label="Email toko" htmlFor="email" error={errors.email} hint="Contoh: halo@tokodimsum.id">
            <Input
              id="email"
              type="email"
              value={draft.email}
              onChange={(event) => update('email', event.target.value)}
              invalid={Boolean(errors.email)}
            />
          </Field>
          <Field
            label="Deskripsi toko"
            htmlFor="description"
            required
            error={errors.description}
            className="lg:col-span-2"
          >
            <Textarea
              id="description"
              rows={3}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              invalid={Boolean(errors.description)}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ImageField
            id="logo"
            label="Logo"
            value={draft.logo}
            onChange={(value) => update('logo', value)}
            previewAspect="wide"
            hint="Gunakan path /images/... atau URL https."
          />
          <ImageField
            id="favicon"
            label="Favicon"
            value={draft.favicon}
            onChange={(value) => update('favicon', value)}
            previewAspect="wide"
          />
        </div>
      </AdminCard>

      <AdminCard title="Kontak & lokasi">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            label="Nomor WhatsApp toko"
            htmlFor="whatsappNumber"
            error={errors.whatsappNumber}
            hint="Format internasional tanpa tanda tambah, contoh 62812xxxxxxx. Kosongkan bila belum ada."
          >
            <Input
              id="whatsappNumber"
              inputMode="tel"
              value={draft.whatsappNumber}
              onChange={(event) => update('whatsappNumber', event.target.value)}
              invalid={Boolean(errors.whatsappNumber)}
              placeholder="Belum diisi"
            />
          </Field>
          <Field label="Jam operasional" htmlFor="operatingHours" error={errors.operatingHours}>
            <Input
              id="operatingHours"
              value={draft.operatingHours}
              onChange={(event) => update('operatingHours', event.target.value)}
              placeholder="Setiap hari 09.00–21.00"
            />
          </Field>
          <Field
            label="Alamat lengkap"
            htmlFor="address"
            error={errors.address}
            className="lg:col-span-2"
          >
            <Textarea
              id="address"
              rows={2}
              value={draft.address}
              onChange={(event) => update('address', event.target.value)}
              invalid={Boolean(errors.address)}
            />
          </Field>
          <Field label="Instagram" htmlFor="instagram" error={errors.instagram} hint="URL profil lengkap.">
            <Input
              id="instagram"
              value={draft.instagram}
              onChange={(event) => update('instagram', event.target.value)}
              invalid={Boolean(errors.instagram)}
            />
          </Field>
          <Field label="TikTok" htmlFor="tiktok" error={errors.tiktok} hint="URL profil lengkap.">
            <Input
              id="tiktok"
              value={draft.tiktok}
              onChange={(event) => update('tiktok', event.target.value)}
              invalid={Boolean(errors.tiktok)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Pengiriman & pembayaran">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            label="Ongkos kirim (Rp)"
            htmlFor="shippingCost"
            required
            error={errors.shippingCost}
            hint="Isi 0 bila pengiriman dikonfirmasi manual via WhatsApp."
          >
            <Input
              id="shippingCost"
              inputMode="numeric"
              value={draft.shippingCost}
              onChange={(event) => update('shippingCost', event.target.value)}
              invalid={Boolean(errors.shippingCost)}
            />
          </Field>
          <Field
            label="Gratis ongkir mulai (Rp)"
            htmlFor="freeShippingMin"
            error={errors.freeShippingMin}
            hint="Kosongkan bila tidak ada promo gratis ongkir."
          >
            <Input
              id="freeShippingMin"
              inputMode="numeric"
              value={draft.freeShippingMin}
              onChange={(event) => update('freeShippingMin', event.target.value)}
              invalid={Boolean(errors.freeShippingMin)}
            />
          </Field>
          <Field label="Informasi pengiriman" htmlFor="shippingInfo" error={errors.shippingInfo}>
            <Textarea
              id="shippingInfo"
              rows={3}
              value={draft.shippingInfo}
              onChange={(event) => update('shippingInfo', event.target.value)}
              placeholder="Contoh: pengiriman memakai kurir instan, biaya dihitung per jarak."
            />
          </Field>
          <Field label="Informasi pembayaran" htmlFor="paymentInfo" error={errors.paymentInfo}>
            <Textarea
              id="paymentInfo"
              rows={3}
              value={draft.paymentInfo}
              onChange={(event) => update('paymentInfo', event.target.value)}
              placeholder="Contoh: transfer bank atau e-wallet setelah pesanan dikonfirmasi."
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="SEO" description="Dipakai pada metadata halaman utama.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Judul SEO" htmlFor="seoTitle" error={errors.seoTitle}>
            <Input
              id="seoTitle"
              value={draft.seoTitle}
              onChange={(event) => update('seoTitle', event.target.value)}
            />
          </Field>
          <Field label="Kata kunci SEO" htmlFor="seoKeywords" error={errors.seoKeywords}>
            <Input
              id="seoKeywords"
              value={draft.seoKeywords}
              onChange={(event) => update('seoKeywords', event.target.value)}
              placeholder="pisahkan dengan koma"
            />
          </Field>
          <Field
            label="Deskripsi SEO"
            htmlFor="seoDescription"
            error={errors.seoDescription}
            className="lg:col-span-2"
          >
            <Textarea
              id="seoDescription"
              rows={2}
              value={draft.seoDescription}
              onChange={(event) => update('seoDescription', event.target.value)}
            />
          </Field>
        </div>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={saving}>
          <Save aria-hidden className="h-5 w-5" />
          {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
        </Button>
        {isPending ? <p className="text-xs text-charcoal/70">Memuat ulang data…</p> : null}
      </div>

      <AdminCard
        title="Reset data demo"
        description="Memulihkan katalog, artikel, testimoni, dan pesanan contoh. Pengaturan toko, akun admin, dan pesanan asli tidak dihapus."
      >
        {resetOpen ? (
          <div className="space-y-4">
            <p className="text-sm text-charcoal/85">
              Ketik <strong>{CONFIRM_PHRASE}</strong> untuk mengonfirmasi. Tindakan ini menimpa kembali
              data demo bawaan (produk, kategori, artikel, testimoni demo, dan pesanan berlabel data
              demo).
            </p>
            <Input
              aria-label="Konfirmasi reset data demo"
              value={resetPhrase}
              onChange={(event) => setResetPhrase(event.target.value)}
              placeholder={CONFIRM_PHRASE}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={handleReset} loading={resetting}>
                <RotateCcw aria-hidden className="h-4 w-4" />
                Reset sekarang
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResetOpen(false);
                  setResetPhrase('');
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw aria-hidden className="h-4 w-4" />
            Reset data demo
          </Button>
        )}
      </AdminCard>
    </form>
  );
}

export default SettingsForm;
