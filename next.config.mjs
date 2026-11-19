/**
 * Konfigurasi Next.js.
 *
 * Berisi:
 * - Security headers (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS, CSP).
 * - Konfigurasi gambar next/image (format WebP/AVIF + remotePatterns terbatas).
 *
 * Catatan CSP: script membutuhkan 'unsafe-inline' pada style untuk Tailwind/inline
 * style Next.js dan 'unsafe-eval' hanya pada mode development (React refresh).
 * Nilai ini sengaja tidak dibuat lebih longgar dari yang diperlukan.
 */

const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    // Aktif secara efektif hanya pada deployment HTTPS. Browser mengabaikan HSTS
    // pada origin http:// (mis. localhost) sehingga aman disertakan.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Hanya host yang benar-benar dipakai yang diizinkan. Tambahkan host lain
    // secara eksplisit bila admin memakai URL gambar eksternal dari CDN lain.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Aset statis tidak perlu di-revalidate.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
};

export default nextConfig;
