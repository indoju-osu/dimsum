import { cn } from '@/lib/utils';

/**
 * Kontrol formulir bersama untuk halaman publik maupun admin.
 * Semua input memiliki tinggi minimal 44px dan label yang terhubung (a11y).
 */

const controlBase =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/45 transition-colors duration-200 focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone/50';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-forest">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-red-600">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-charcoal/70">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        controlBase,
        invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-stone',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ className, invalid, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        controlBase,
        'min-h-[44px] leading-relaxed',
        invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-stone',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        controlBase,
        'appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10',
        invalid ? 'border-red-400' : 'border-stone',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2326351F' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  className,
  label,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-1 text-sm text-charcoal',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded border-stone text-forest accent-forest focus:ring-2 focus:ring-forest/40"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function SwitchLine({
  label,
  description,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone bg-white px-4 py-2"
    >
      <span>
        <span className="block text-sm font-medium text-forest">{label}</span>
        {description ? <span className="block text-xs text-charcoal/70">{description}</span> : null}
      </span>
      <input
        id={id}
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded border-stone accent-forest"
        {...props}
      />
    </label>
  );
}

export default Input;
