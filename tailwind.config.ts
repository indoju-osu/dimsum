import type { Config } from 'tailwindcss';

/**
 * Design token brand "Modern Artisan Dimsum — Fresh, Warm & Premium".
 * Semua warna brand hanya didefinisikan di sini agar konsisten di seluruh halaman.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F6F2', // Warm Ivory - background utama
        stone: '#E9E5DA', // Soft Stone - background section/kartu
        sand: '#CFB799', // Sand Beige - elemen sekunder/dekorasi
        olive: '#838655', // Olive Sage - badge & aksen
        harvest: '#DDAE35', // Harvest Gold - CTA & highlight
        forest: '#26351F', // Forest Green - heading & teks utama
        charcoal: '#333333', // Charcoal - teks deskripsi
        brand: {
          ivory: '#F7F6F2',
          stone: '#E9E5DA',
          sand: '#CFB799',
          olive: '#838655',
          harvest: '#DDAE35',
          forest: '#26351F',
          charcoal: '#333333',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(38, 53, 31, 0.04), 0 8px 24px -12px rgba(38, 53, 31, 0.16)',
        card: '0 1px 3px rgba(38, 53, 31, 0.06), 0 12px 32px -20px rgba(38, 53, 31, 0.28)',
      },
      spacing: {
        '4.5': '1.125rem',
        '15': '3.75rem',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 260ms ease-out both',
        'fade-in': 'fade-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
