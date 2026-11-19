'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/FormControls';

export type VariantDraft = { name: string; priceAdjustment: string; isDefault: boolean };

/**
 * Editor varian produk (mis. "5 pcs", "10 pcs"). Selisih harga boleh negatif,
 * dan tepat satu varian ditandai default bila ada varian.
 */
export function VariantEditor({
  variants,
  onChange,
}: {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}) {
  function update(index: number, patch: Partial<VariantDraft>) {
    onChange(variants.map((variant, position) => (position === index ? { ...variant, ...patch } : variant)));
  }

  return (
    <div className="space-y-3">
      {variants.length === 0 ? (
        <p className="text-sm text-charcoal/70">
          Belum ada varian. Produk dijual dengan satu harga tunggal.
        </p>
      ) : (
        <ul className="space-y-3">
          {variants.map((variant, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-xl border border-stone bg-white p-3 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-end"
            >
              <Field label={`Nama varian ${index + 1}`} htmlFor={`variant-name-${index}`}>
                <Input
                  id={`variant-name-${index}`}
                  value={variant.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  placeholder="10 pcs"
                />
              </Field>
              <Field
                label="Selisih harga (Rp)"
                htmlFor={`variant-price-${index}`}
                hint="0 = harga sama"
              >
                <Input
                  id={`variant-price-${index}`}
                  inputMode="numeric"
                  value={variant.priceAdjustment}
                  onChange={(event) => update(index, { priceAdjustment: event.target.value })}
                  placeholder="0"
                />
              </Field>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-charcoal">
                <input
                  type="checkbox"
                  checked={variant.isDefault}
                  onChange={(event) =>
                    onChange(
                      variants.map((item, position) => ({
                        ...item,
                        isDefault: position === index ? event.target.checked : false,
                      })),
                    )
                  }
                  className="h-5 w-5 rounded border-stone accent-forest"
                />
                Default
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-700 hover:bg-red-50"
                onClick={() => onChange(variants.filter((_, position) => position !== index))}
                aria-label={`Hapus varian ${index + 1}`}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...variants, { name: '', priceAdjustment: '0', isDefault: false }])}
        disabled={variants.length >= 10}
      >
        <Plus aria-hidden className="h-4 w-4" />
        Tambah varian
      </Button>
    </div>
  );
}

export default VariantEditor;
