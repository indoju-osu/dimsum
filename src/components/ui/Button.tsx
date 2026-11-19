import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Kelas tombol bersama. Semua varian memenuhi target sentuh minimal 44px.
 * Catatan kontras (WCAG AA):
 * - primary  : Harvest Gold #DDAE35 + teks Forest Green #26351F  -> ±7.0:1
 * - secondary: Forest Green #26351F + teks putih                -> ±12.5:1
 * - whatsapp : #128C7E + teks putih                             -> ±4.6:1
 * - danger   : red-700 + teks putih                             -> ±6.0:1
 */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ivory';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-harvest text-forest hover:bg-[#c99a26] active:bg-[#bb8d20]',
    secondary: 'bg-forest text-white hover:bg-[#1d2a18] active:bg-[#16220f]',
    outline: 'border border-forest/25 bg-white text-forest hover:border-forest/50 hover:bg-stone/60',
    ghost: 'text-forest hover:bg-stone/70',
    whatsapp: 'bg-[#128C7E] text-white hover:bg-[#0f7a6e] active:bg-[#0d6a60]',
    danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'min-h-[44px] px-3.5 text-sm',
    md: 'min-h-[44px] px-5 text-sm sm:text-base',
    lg: 'min-h-[52px] px-6 text-base',
  };

  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  external?: boolean;
  children: React.ReactNode;
  prefetch?: boolean;
  'aria-label'?: string;
  title?: string;
};

/** Tautan yang tampil seperti tombol. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  external = false,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = buttonStyles({ variant, size, className });
  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={rest['aria-label']}
        title={rest.title}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} prefetch={rest.prefetch} aria-label={rest['aria-label']}>
      {children}
    </Link>
  );
}

export default Button;
