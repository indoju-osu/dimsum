'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { TestimonialView } from '@/types';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, SwitchLine, Textarea } from '@/components/ui/FormControls';
import { AdminCard } from '@/components/admin/AdminUI';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { ImageField } from '@/components/admin/ImageField';
import { useToast } from '@/components/ui/Toast';

type Draft = {
  name: string;
  role: string;
  rating: string;
  content: string;
  photo: string;
  isVisible: boolean;
  isDemoData: boolean;
};

const EMPTY: Draft = {
  name: '',
  role: '',
  rating: '5',
  content: '',
  photo: '',
  isVisible: true,
  isDemoData: false,
};

function toDraft(item: TestimonialView): Draft {
  return {
    name: item.name,
    role: item.role ?? '',
    rating: String(item.rating),
    content: item.content,
    photo: item.photo ?? '',
    isVisible: item.isVisible,
    isDemoData: item.isDemoData,
  };
}

/**
 * Manajemen testimoni: tambah, ubah inline, dan hapus.
 *
 * Testimoni berlabel "Data demo" adalah contoh bawaan yang harus diganti
 * dengan ulasan asli pelanggan sebelum dipakai produksi.
 */
export function TestimonialManager({ testimonials }: { testimonials: TestimonialView[] }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  function refresh(message: string, description?: string) {
    toast.success(message, description);
    startTransition(() => router.refresh());
  }

  function payload(draft: Draft) {
    return {
      name: draft.name,
      role: draft.role,
      rating: Number(draft.rating),
      content: draft.content,
      photo: draft.photo,
      isVisible: draft.isVisible,
      isDemoData: draft.isDemoData,
    };
  }

  async function send(url: string, method: 'POST' | 'PUT', draft: Draft): Promise<boolean> {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(draft)),
      });
      const result: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error('Gagal menyimpan testimoni', result.error ?? 'Silakan coba lagi.');
        return false;
      }
      return true;
    } catch {
      toast.error('Gagal menyimpan testimoni', 'Tidak dapat menghubungi server.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createDraft.name.trim().length < 2 || createDraft.content.trim().length < 10) {
      toast.error('Periksa kembali isian', 'Nama minimal 2 karakter dan ulasan minimal 10 karakter.');
      return;
    }
    if (!(await send('/api/admin/testimonials', 'POST', createDraft))) return;
    setCreateDraft(EMPTY);
    setCreating(false);
    refresh('Testimoni ditambahkan', createDraft.name);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (!(await send(`/api/admin/testimonials/${id}`, 'PUT', editDraft))) return;
    setEditingId(null);
    refresh('Testimoni diperbarui', editDraft.name);
  }

  async function handleDelete(item: TestimonialView) {
    const confirmed = window.confirm(`Hapus testimoni dari "${item.name}"?\n\nTindakan ini permanen.`);
    if (!confirmed) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/testimonials/${item.id}`, { method: 'DELETE' });
      const result: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error('Gagal menghapus testimoni', result.error ?? 'Silakan coba lagi.');
        return;
      }
      refresh('Testimoni dihapus', item.name);
    } catch {
      toast.error('Gagal menghapus testimoni', 'Tidak dapat menghubungi server.');
    } finally {
      setBusy(false);
    }
  }

  function DraftFields({
    draft,
    setDraft,
    prefix,
  }: {
    draft: Draft;
    setDraft: (draft: Draft) => void;
    prefix: string;
  }) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama pelanggan" htmlFor={`${prefix}-name`} required>
            <Input
              id={`${prefix}-name`}
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Field>
          <Field label="Keterangan" htmlFor={`${prefix}-role`} hint="Contoh: Pelanggan tetap · Bandung">
            <Input
              id={`${prefix}-role`}
              value={draft.role}
              onChange={(event) => setDraft({ ...draft, role: event.target.value })}
            />
          </Field>
          <Field label="Rating" htmlFor={`${prefix}-rating`} required>
            <Select
              id={`${prefix}-rating`}
              value={draft.rating}
              onChange={(event) => setDraft({ ...draft, rating: event.target.value })}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} bintang
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <SwitchLine
              id={`${prefix}-visible`}
              label="Tampilkan di situs"
              checked={draft.isVisible}
              onChange={(event) => setDraft({ ...draft, isVisible: event.target.checked })}
            />
            <SwitchLine
              id={`${prefix}-demo`}
              label="Tandai data demo"
              checked={draft.isDemoData}
              onChange={(event) => setDraft({ ...draft, isDemoData: event.target.checked })}
            />
          </div>
          <Field
            label="Isi ulasan"
            htmlFor={`${prefix}-content`}
            required
            className="sm:col-span-2"
          >
            <Textarea
              id={`${prefix}-content`}
              rows={3}
              value={draft.content}
              onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            />
          </Field>
        </div>
        <ImageField
          id={`${prefix}-photo`}
          label="Foto pelanggan (opsional)"
          value={draft.photo}
          onChange={(value) => setDraft({ ...draft, photo: value })}
          previewAspect="wide"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Testimoni baru"
        description="Tulis ulasan asli pelanggan. Jangan menampilkan ulasan rekaan sebagai data produksi."
        actions={
          <Button variant="outline" size="sm" onClick={() => setCreating((open) => !open)}>
            <Plus aria-hidden className="h-4 w-4" />
            {creating ? 'Tutup form' : 'Tambah testimoni'}
          </Button>
        }
      >
        {creating ? (
          <form onSubmit={handleCreate} className="space-y-5">
            <DraftFields draft={createDraft} setDraft={setCreateDraft} prefix="new-testimonial" />
            <Button type="submit" loading={busy}>
              Simpan testimoni
            </Button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">
            Klik “Tambah testimoni” untuk menambahkan ulasan pelanggan.
          </p>
        )}
      </AdminCard>

      <AdminCard title={`Daftar testimoni (${testimonials.length})`}>
        {testimonials.length === 0 ? (
          <EmptyState title="Belum ada testimoni" description="Tambahkan ulasan pelanggan pertama." />
        ) : (
          <ul className="space-y-3">
            {testimonials.map((item) => (
              <li key={item.id} className="rounded-xl border border-stone bg-white p-4">
                {editingId === item.id ? (
                  <form onSubmit={(event) => handleUpdate(event, item.id)} className="space-y-5">
                    <DraftFields draft={editDraft} setDraft={setEditDraft} prefix={`edit-${item.id}`} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" loading={busy}>
                        Simpan perubahan
                      </Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        Batal
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 max-w-3xl">
                      <p className="flex items-center gap-2 font-medium text-forest">
                        {item.name}
                        <span className="flex items-center gap-0.5 text-harvest" aria-label={`${item.rating} dari 5 bintang`}>
                          {Array.from({ length: item.rating }).map((_, index) => (
                            <Star key={index} aria-hidden className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </span>
                      </p>
                      <p className="text-xs text-charcoal/70">{item.role || 'Pelanggan'}</p>
                      <p className="mt-1 text-sm text-charcoal/85">{item.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={item.isVisible ? 'olive' : 'neutral'}>
                        {item.isVisible ? 'Tampil' : 'Disembunyikan'}
                      </Badge>
                      {item.isDemoData ? <Badge tone="harvest">Data demo</Badge> : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditDraft(toDraft(item));
                        }}
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                        Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item)}
                        disabled={busy}
                        aria-label={`Hapus testimoni dari ${item.name}`}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {isPending ? <p className="mt-4 text-xs text-charcoal/70">Memuat ulang data…</p> : null}
      </AdminCard>
    </div>
  );
}

export default TestimonialManager;
