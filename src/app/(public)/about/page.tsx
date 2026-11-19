import type { Metadata } from 'next';
import { Clock, Instagram, Mail, MapPin, Music2, Phone } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { SectionHeading } from '@/components/ui/Misc';
import { ButtonLink } from '@/components/ui/Button';
import { WhatsAppLink } from '@/components/public/WhatsAppLink';
import { TestimonialCard } from '@/components/public/TestimonialCard';
import { getVisibleTestimonials } from '@/lib/database';
import { getStoreSettings, hasWhatsAppNumber } from '@/lib/settings';
import { buildGeneralInquiryMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Tentang Kami',
  description:
    'Kenali dapur dimsum kami: cara kami memilih bahan, menyiapkan pesanan, dan melayani pelanggan setiap hari.',
  alternates: { canonical: '/about' },
};

/** Halaman profil usaha: cerita, cara kerja, dan informasi kontak toko. */
export default async function AboutPage() {
  const [settings, testimonials] = await Promise.all([
    getStoreSettings(),
    getVisibleTestimonials(3),
  ]);
  const whatsappUrl = hasWhatsAppNumber(settings)
    ? buildWhatsAppUrl(settings.whatsappNumber, buildGeneralInquiryMessage(settings.brandName))
    : null;

  return (
    <div className="space-y-14 pb-16">
      <section className="bg-stone/40 py-12 md:py-16">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Tentang kami"
              title={`Cerita dapur ${settings.brandName}`}
              description={settings.description}
              as="h1"
            />
            <p className="text-charcoal/85">
              Kami adalah usaha kuliner rumahan yang fokus pada dimsum. Setiap pesanan disiapkan
              setelah dikonfirmasi, sehingga tekstur dan rasa tetap terjaga saat sampai di tangan
              Anda.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/products">Lihat produk kami</ButtonLink>
              <WhatsAppLink url={whatsappUrl} variant="secondary">
                Tanya langsung
              </WhatsAppLink>
            </div>
          </div>
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-stone bg-white shadow-card">
            <ImageWithFallback
              src="/images/about/dapur-kami.webp"
              alt={`Foto ilustrasi dapur ${settings.brandName}`}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="container-page space-y-6">
        <SectionHeading
          eyebrow="Cara kami bekerja"
          title="Dari dapur sampai meja Anda"
          description="Tiga langkah sederhana yang membuat setiap pesanan tetap rapi dan konsisten."
        />
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: '1. Pesan & konfirmasi',
              body: 'Pilih dimsum di situs, kirim pesanan lewat WhatsApp, lalu admin mengonfirmasi ketersediaan dan total akhir.',
            },
            {
              title: '2. Disiapkan harian',
              body: 'Pesanan disiapkan dalam batch kecil agar dimsum tidak terlalu lama disimpan sebelum dikukus.',
            },
            {
              title: '3. Ambil atau kirim',
              body: 'Ambil sendiri di toko atau minta dikirim. Waktu pengambilan dan ongkos kirim dikonfirmasi admin.',
            },
          ].map((step) => (
            <li key={step.title} className="card-surface space-y-2 p-5">
              <h3 className="font-display text-lg text-forest">{step.title}</h3>
              <p className="text-sm leading-relaxed text-charcoal/85">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page grid gap-4 sm:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone bg-white">
          <ImageWithFallback
            src="/images/about/proses-produksi.webp"
            alt="Foto ilustrasi proses produksi dimsum"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone bg-white">
          <ImageWithFallback
            src="/images/about/aktivitas-usaha.webp"
            alt="Foto ilustrasi aktivitas usaha dimsum"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="container-page grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-surface space-y-4 p-6">
          <h2 className="font-display text-2xl text-forest">Informasi toko</h2>
          <ul className="space-y-3 text-sm text-charcoal/85">
            <li className="flex gap-2">
              <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
              <span>
                {settings.address ?? (
                  <span className="text-charcoal/70">
                    Alamat toko belum diatur oleh pemilik usaha.
                  </span>
                )}
              </span>
            </li>
            <li className="flex gap-2">
              <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
              <span>
                {settings.operatingHours ?? (
                  <span className="text-charcoal/70">
                    Jam operasional belum diatur oleh pemilik usaha.
                  </span>
                )}
              </span>
            </li>
            <li className="flex gap-2">
              <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
              <span>
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="link-underline">
                    Hubungi melalui WhatsApp
                  </a>
                ) : (
                  <span className="text-charcoal/70">Nomor WhatsApp belum diatur.</span>
                )}
              </span>
            </li>
            {settings.email ? (
              <li className="flex gap-2">
                <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <a href={`mailto:${settings.email}`} className="link-underline">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.instagram ? (
              <li className="flex gap-2">
                <Instagram aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  Instagram
                </a>
              </li>
            ) : null}
            {settings.tiktok ? (
              <li className="flex gap-2">
                <Music2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-olive" />
                <a
                  href={settings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  TikTok
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="card-surface space-y-4 p-6 text-sm text-charcoal/85">
          <h2 className="font-display text-2xl text-forest">Pengiriman &amp; pembayaran</h2>
          <p>
            {settings.shippingInfo ??
              'Ongkos kirim dan jangkauan area dikonfirmasi admin melalui WhatsApp sesuai alamat Anda.'}
          </p>
          <p>
            {settings.paymentInfo ??
              'Metode pembayaran dikonfirmasi admin saat pesanan diproses.'}
          </p>
          {settings.freeShippingMin && settings.freeShippingMin > 0 ? (
            <p>
              Gratis ongkir untuk pembelian minimal{' '}
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0,
              }).format(settings.freeShippingMin)}
              .
            </p>
          ) : null}
          <p className="rounded-2xl border border-dashed border-sand bg-stone/50 p-3 text-xs">
            Semua foto di situs ini adalah foto ilustrasi berlisensi, bukan dokumentasi asli usaha.
          </p>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="container-page space-y-6">
          <SectionHeading eyebrow="Testimoni" title="Kepercayaan pelanggan" align="center" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id}>
                <TestimonialCard testimonial={testimonial} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
