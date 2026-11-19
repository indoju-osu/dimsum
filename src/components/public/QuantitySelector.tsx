'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CART_MAX_QUANTITY } from '@/lib/constants';

/** Pemilih jumlah dengan tombol besar (target sentuh 44px). */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = CART_MAX_QUANTITY,
  disabled = false,
  label = 'Jumlah',
  size = 'md',
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const effectiveMax = Math.max(min, Math.min(max, CART_MAX_QUANTITY));
  const buttonSize = size === 'sm' ? 'h-11 w-11' : 'h-11 w-11';

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Kurangi ${label.toLowerCase()}`}
        className={cn(
          buttonSize,
          'inline-flex items-center justify-center rounded-xl border border-stone bg-white text-forest transition hover:border-olive disabled:opacity-40',
        )}
      >
        <Minus aria-hidden className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={effectiveMax}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(parsed)) return;
          onChange(Math.min(effectiveMax, Math.max(min, parsed)));
        }}
        className="h-11 w-14 rounded-xl border border-stone bg-white text-center text-sm font-semibold text-forest focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30 disabled:bg-stone/50"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(effectiveMax, value + 1))}
        disabled={disabled || value >= effectiveMax}
        aria-label={`Tambah ${label.toLowerCase()}`}
        className={cn(
          buttonSize,
          'inline-flex items-center justify-center rounded-xl border border-stone bg-white text-forest transition hover:border-olive disabled:opacity-40',
        )}
      >
        <Plus aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}

export default QuantitySelector;
