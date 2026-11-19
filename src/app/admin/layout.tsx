import type { Metadata } from 'next';

/** Area admin tidak boleh diindeks mesin pencari. */
export const metadata: Metadata = {
  title: { default: 'Dashboard Admin', template: '%s | Admin' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ivory text-charcoal">{children}</div>;
}
