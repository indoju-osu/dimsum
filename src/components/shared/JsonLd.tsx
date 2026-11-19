import { safeJsonForScript } from '@/lib/sanitization';

/**
 * Structured data (schema.org) untuk SEO.
 * JSON di-escape sebelum ditulis ke dalam <script> agar tidak dapat dipakai
 * untuk keluar dari konteks skrip (anti-XSS).
 */
export function JsonLd({ data, id }: { data: Record<string, unknown>; id?: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonForScript(data) }}
    />
  );
}

export default JsonLd;
