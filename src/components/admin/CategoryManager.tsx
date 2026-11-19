'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { CategorySummary } from '@/types';
import { Button } from '@/components/ui/Button';
import { Field, Input, SwitchLine, Textarea } from '@/components/ui/FormControls';
import { AdminCard } from '@/components/admin/AdminUI';
import { ImageField } from '@/components/admin/ImageField';
import { Badge, EmptyState } from '@/components/ui/Misc';
import { useToast } from '@/components/ui/Toast';

type Draft = {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY: Draft = {
  name: '',
  slug: '',
  description: '',
  image: '',
  sortOrder: '0',
  isActive: true,
};

/**
 * Manajemen kategori: form tambah, form ubah inline per baris, dan hapus.
 * Kategori yang masih dipakai produk tidak dapat dihapus (server merespons 409
 * dengan saran menonaktifkannya).
 */
export function CategoryManager({ categories }: { categories: CategorySummary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toDraft(category: CategorySummary): Draft {
    return {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      image: category.image ?? '',
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
    };
  }

  function refresh(message: string, description?: string) {
    toast.success(message, description);
    startTransition(() => router.refresh());
  }

  async function submit(url: string, method: 'POST' | 'PUT', payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: {
        error?: string;
        details?: { path: string; message: string }[];
      } = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error('Gagal menyimpan kategori', result.error ?? 'Silakan coba lagi.');
        return false;
      }
      return true;
    } catch {
      toast.error('Gagal menyimpan kategori', 'Tidak dapat menghubungi server.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createDraft.name.trim().length < 2) {
      toast.error('Nama kategori terlalu pendek', 'Minimal 2 karakter.');
      return;
    }
    const ok = await submit('/api/admin/categories', 'POST', createDraft);
    if (!ok) return;
    setCreateDraft(EMPTY);
    setCreating(false);
    refresh('Kategori ditambahkan', createDraft.name);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const ok = await submit(`/api/admin/categories/${id}`, 'PUT', editDraft);
    if (!ok) return;
    setEditingId(null);
    refresh('Kategori diperbarui', editDraft.name);
  }

  async function handleDelete(category: CategorySummary) {
    const confirmed = window.confirm(`Hapus kategori "${category.name}"?\n\nTindakan ini permanen.`);
    if (!confirmed) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
      const result: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error('Gagal menghapus kategori', result.error ?? 'Silakan coba lagi.');
        return;
      }
      refresh('Kategori dihapus', category.name);
    } catch {
      toast.error('Gagal menghapus kategori', 'Tidak dapat menghubungi server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminCard
        title="Kategori baru"
        description="Urutan kecil tampil lebih dahulu pada menu kategori."
        actions={
          <Button variant="outline" size="sm" onClick={() => setCreating((open) => !open)}>
            <Plus aria-hidden className="h-4 w-4" />
            {creating ? 'Tutup form' : 'Tambah kategori'}
          </Button>
        }
      >
        {creating ? (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Nama kategori" htmlFor="new-category-name" required>
                <Input
                  id="new-category-name"
                  value={createDraft.name}
                  onChange={(event) => setCreateDraft({ ...createDraft, name: event.target.value })}
                  placeholder="Dimsum Ayam"
                />
              </Field>
              <Field
                label="Slug URL"
                htmlFor="new-category-slug"
                hint="Kosongkan untuk membuat otomatis."
              >
                <Input
                  id="new-category-slug"
                  value={createDraft.slug}
                  onChange={(event) => setCreateDraft({ ...createDraft, slug: event.target.value })}
                  placeholder="dimsum-ayam"
                />
              </Field>
              <Field label="Deskripsi" htmlFor="new-category-description" className="lg:col-span-2">
                <Textarea
                  id="new-category-description"
                  rows={2}
                  value={createDraft.description}
                  onChange={(event) =>
                    setCreateDraft({ ...createDraft, description: event.target.value })
                  }
                />
              </Field>
              <Field label="Urutan" htmlFor="new-category-order">
                <Input
                  id="new-category-order"
                  inputMode="numeric"
                  value={createDraft.sortOrder}
                  onChange={(event) => setCreateDraft({ ...createDraft, sortOrder: event.target.value })}
                />
              </Field>
              <div className="flex items-end">
                <SwitchLine
                  id="new-category-active"
                  label="Aktif"
                  description="Kategori nonaktif disembunyikan dari katalog."
                  checked={createDraft.isActive}
                  onChange={(event) =>
                    setCreateDraft({ ...createDraft, isActive: event.target.checked })
                  }
                />
              </div>
            </div>
            <ImageField
              id="new-category-image"
              label="Foto kategori"
              value={createDraft.image}
              onChange={(value) => setCreateDraft({ ...createDraft, image: value })}
            />
            <Button type="submit" loading={busy}>
              Simpan kategori
            </Button>
          </form>
        ) : (
          <p className="text-sm text-charcoal/70">
            Klik “Tambah kategori” untuk membuat kategori baru.
          </p>
        )}
      </AdminCard>

      <AdminCard title={`Daftar kategori (${categories.length})`}>
        {categories.length === 0 ? (
          <EmptyState title="Belum ada kategori" description="Tambahkan kategori pertama Anda." />
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => (
              <li key={category.id} className="rounded-xl border border-stone bg-white p-4">
                {editingId === category.id ? (
                  <form onSubmit={(event) => handleUpdate(event, category.id)} className="space-y-5">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <Field label="Nama kategori" htmlFor={`name-${category.id}`} required>
                        <Input
                          id={`name-${category.id}`}
                          value={editDraft.name}
                          onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                        />
                      </Field>
                      <Field label="Slug URL" htmlFor={`slug-${category.id}`}>
                        <Input
                          id={`slug-${category.id}`}
                          value={editDraft.slug}
                          onChange={(event) => setEditDraft({ ...editDraft, slug: event.target.value })}
                        />
                      </Field>
                      <Field
                        label="Deskripsi"
                        htmlFor={`description-${category.id}`}
                        className="lg:col-span-2"
                      >
                        <Textarea
                          id={`description-${category.id}`}
                          rows={2}
                          value={editDraft.description}
                          onChange={(event) =>
                            setEditDraft({ ...editDraft, description: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Urutan" htmlFor={`order-${category.id}`}>
                        <Input
                          id={`order-${category.id}`}
                          inputMode="numeric"
                          value={editDraft.sortOrder}
                          onChange={(event) =>
                            setEditDraft({ ...editDraft, sortOrder: event.target.value })
                          }
                        />
                      </Field>
                      <div className="flex items-end">
                        <SwitchLine
                          id={`active-${category.id}`}
                          label="Aktif"
                          checked={editDraft.isActive}
                          onChange={(event) =>
                            setEditDraft({ ...editDraft, isActive: event.target.checked })
                          }
                        />
                      </div>
                    </div>
                    <ImageField
                      id={`image-${category.id}`}
                      label="Foto kategori"
                      value={editDraft.image}
                      onChange={(value) => setEditDraft({ ...editDraft, image: value })}
                      previewAspect="wide"
                    />
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
                    <div className="min-w-0">
                      <p className="font-medium text-forest">{category.name}</p>
                      <p className="text-xs text-charcoal/70">
                        /kategori/{category.slug} · urutan {category.sortOrder}
                        {typeof category.productCount === 'number'
                          ? ` · ${category.productCount} produk`
                          : ''}
                      </p>
                      {category.description ? (
                        <p className="mt-1 max-w-2xl text-sm text-charcoal/80">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={category.isActive ? 'olive' : 'neutral'}>
                        {category.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditDraft(toDraft(category));
                        }}
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                        Ubah
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(category)}
                        disabled={busy}
                        aria-label={`Hapus kategori ${category.name}`}
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

export default CategoryManager;
