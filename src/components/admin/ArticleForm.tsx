'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import type { ArticleDetail } from '@/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/FormControls';
import { AdminCard } from '@/components/admin/AdminUI';
import { ImageField } from '@/components/admin/ImageField';
import { useToast } from '@/components/ui/Toast';

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED';
};

const EMPTY: Draft = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Tips',
  status: 'DRAFT',
};

const ARTICLE_CATEGORIES = ['Tips', 'Resep', 'Acara', 'Berita', 'Panduan'];

/** Form tambah/ubah artikel. Konten mendukung teks bebas (baris kosong = paragraf baru). */
export function ArticleForm({ article }: { article?: ArticleDetail }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(article);

  const [draft, setDraft] = useState<Draft>(
    article
      ? {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage ?? '',
          category: article.category,
          status: article.status,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (draft.title.trim().length < 3) next.title = 'Judul minimal 3 karakter.';
    if (draft.excerpt.trim().length < 10) next.excerpt = 'Ringkasan minimal 10 karakter.';
    if (draft.content.trim().length < 20) next.content = 'Konten minimal 20 karakter.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      toast.error('Periksa kembali isian', 'Beberapa kolom belum lengkap.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        isEdit ? `/api/admin/articles/${article!.id}` : '/api/admin/articles',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        },
      );
      const result: {
        error?: string;
        article?: { id: string; slug: string };
      } = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error('Gagal menyimpan artikel', result.error ?? 'Silakan coba lagi.');
        return;
      }

      toast.success(isEdit ? 'Artikel diperbarui' : 'Artikel dibuat', draft.title);
      if (isEdit) {
        router.refresh();
      } else if (result.article?.id) {
        router.push(`/admin/articles/${result.article.id}`);
      } else {
        router.push('/admin/articles');
      }
    } catch {
      toast.error('Gagal menyimpan artikel', 'Tidak dapat menghubungi server.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!article) return;
    const confirmed = window.confirm(`Hapus artikel "${article.title}"?\n\nTindakan ini permanen.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' });
      const result: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error('Gagal menghapus artikel', result.error ?? 'Silakan coba lagi.');
        return;
      }
      toast.success('Artikel dihapus', article.title);
      router.push('/admin/articles');
    } catch {
      toast.error('Gagal menghapus artikel', 'Tidak dapat menghubungi server.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <AdminCard title="Konten artikel">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Judul" htmlFor="title" required error={errors.title} className="lg:col-span-2">
            <Input
              id="title"
              value={draft.title}
              onChange={(event) => update('title', event.target.value)}
              invalid={Boolean(errors.title)}
              placeholder="Ide menu dimsum untuk acara kantor"
            />
          </Field>
          <Field
            label="Slug URL"
            htmlFor="slug"
            hint={isEdit ? 'Ubah hanya bila perlu; tautan lama akan berubah.' : 'Kosongkan untuk otomatis.'}
          >
            <Input
              id="slug"
              value={draft.slug}
              onChange={(event) => update('slug', event.target.value)}
              placeholder="ide-menu-dimsum-acara-kantor"
            />
          </Field>
          <Field label="Kategori artikel" htmlFor="category" required>
            <Select
              id="category"
              value={draft.category}
              onChange={(event) => update('category', event.target.value)}
            >
              {ARTICLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ringkasan" htmlFor="excerpt" required error={errors.excerpt} className="lg:col-span-2">
            <Textarea
              id="excerpt"
              rows={2}
              value={draft.excerpt}
              onChange={(event) => update('excerpt', event.target.value)}
              invalid={Boolean(errors.excerpt)}
              placeholder="Ringkasan singkat yang tampil pada daftar artikel."
            />
          </Field>
          <Field
            label="Isi artikel"
            htmlFor="content"
            required
            error={errors.content}
            hint="Pisahkan paragraf dengan satu baris kosong. Baris diawali “## ” menjadi sub-judul."
            className="lg:col-span-2"
          >
            <Textarea
              id="content"
              rows={14}
              value={draft.content}
              onChange={(event) => update('content', event.target.value)}
              invalid={Boolean(errors.content)}
            />
          </Field>
        </div>
      </AdminCard>

      <AdminCard title="Foto sampul">
        <ImageField
          id="coverImage"
          label="URL atau path foto sampul"
          value={draft.coverImage}
          onChange={(value) => update('coverImage', value)}
          previewAspect="wide"
          hint="Kosongkan untuk memakai gambar fallback."
        />
      </AdminCard>

      <AdminCard title="Publikasi">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Status" htmlFor="status" required>
            <Select
              id="status"
              value={draft.status}
              onChange={(event) => update('status', event.target.value as Draft['status'])}
            >
              <option value="DRAFT">Draft (belum tampil)</option>
              <option value="PUBLISHED">Terbit</option>
            </Select>
          </Field>
          <p className="self-end text-sm text-charcoal/70">
            Artikel terbit otomatis mendapatkan tanggal publikasi dan masuk sitemap.
          </p>
        </div>
      </AdminCard>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={saving}>
          <Save aria-hidden className="h-5 w-5" />
          {saving ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Simpan artikel'}
        </Button>
        <ButtonLink href="/admin/articles" variant="outline" size="lg">
          Batal
        </ButtonLink>
        {isEdit && article ? (
          <>
            <ButtonLink
              href={`/articles/${article.slug}`}
              variant="ghost"
              size="lg"
              external
            >
              Lihat artikel
            </ButtonLink>
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
              loading={deleting}
            >
              <Trash2 aria-hidden className="h-5 w-5" />
              Hapus
            </Button>
          </>
        ) : null}
      </div>
    </form>
  );
}

export default ArticleForm;
