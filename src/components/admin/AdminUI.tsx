import { cn } from '@/lib/utils';

/**
 * Elemen tampilan bersama untuk halaman admin. Sengaja tanpa state agar bisa
 * dipakai komponen Server maupun Client.
 */

export function AdminPageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-stone pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl text-forest sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-charcoal/80">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-stone bg-white shadow-sm', className)}>
      {title || actions ? (
        <header className="flex flex-col gap-2 border-b border-stone px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="font-display text-lg text-forest">{title}</h2> : null}
            {description ? <p className="text-xs text-charcoal/70">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn('px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'warning' | 'success';
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-harvest/50 bg-harvest/10'
      : tone === 'success'
        ? 'border-olive/40 bg-olive/10'
        : 'border-stone bg-white';

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70">{label}</p>
      <p className="mt-1.5 font-display text-2xl text-forest">{value}</p>
      {hint ? <p className="mt-1 text-xs text-charcoal/70">{hint}</p> : null}
    </div>
  );
}

export function TableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('-mx-5 overflow-x-auto px-5', className)}>
      <table className="w-full min-w-[760px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  scope = 'col',
}: {
  children?: React.ReactNode;
  className?: string;
  scope?: 'col' | 'row';
}) {
  return (
    <th
      scope={scope}
      className={cn(
        'border-b border-stone px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/70',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn('border-b border-stone/70 px-3 py-3 align-middle', className)}>
      {children}
    </td>
  );
}

/** Kelas badge status pesanan (mengikuti ORDER_STATUS_TONE). */
export function statusBadgeClass(tone: string): string {
  return cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone);
}
