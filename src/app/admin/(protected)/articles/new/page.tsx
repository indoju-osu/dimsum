import { AdminPageHeader } from '@/components/admin/AdminUI';
import { ArticleForm } from '@/components/admin/ArticleForm';

export const metadata = { title: 'Tambah Artikel' };

/** Halaman tambah artikel baru. */
export default function NewArticlePage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Artikel"
        title="Tambah artikel"
        description="Simpan sebagai draft untuk meninjau dulu, atau langsung terbitkan."
      />
      <ArticleForm />
    </div>
  );
}
