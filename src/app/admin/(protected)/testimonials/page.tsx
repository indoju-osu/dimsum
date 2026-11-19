import { AdminPageHeader } from '@/components/admin/AdminUI';
import { TestimonialManager } from '@/components/admin/TestimonialManager';
import { listAdminTestimonials } from '@/lib/admin-data';

export const metadata = { title: 'Testimoni' };

/** Halaman manajemen testimoni pelanggan. */
export default async function AdminTestimonialsPage() {
  const testimonials = await listAdminTestimonials();

  return (
    <div>
      <AdminPageHeader
        title="Testimoni"
        description="Ulasan yang ditampilkan di beranda dan halaman testimoni. Ganti data demo dengan ulasan asli pelanggan."
      />
      <TestimonialManager testimonials={testimonials} />
    </div>
  );
}
