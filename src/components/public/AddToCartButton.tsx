'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';
import { QuantitySelector } from './QuantitySelector';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export type AddToCartProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  finalPrice: number;
  stock: number;
  isAvailable: boolean;
  isSoldOut: boolean;
};

/**
 * Tombol tambah ke keranjang dengan pemilih jumlah.
 * Harga di keranjang hanya untuk tampilan; server memverifikasinya kembali
 * sebelum checkout.
 */
export function AddToCartButton({
  product,
  variantId = null,
  variantName = null,
  withQuantity = false,
  size = 'md',
  variant = 'primary',
  className,
  fullWidth = false,
}: {
  product: AddToCartProduct;
  variantId?: string | null;
  variantName?: string | null;
  withQuantity?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
  fullWidth?: boolean;
}) {
  const { addItem } = useCart();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const maxStock = Math.max(1, Math.min(product.stock, 99));
  const disabled = product.isSoldOut || !product.isAvailable || product.stock <= 0;

  const handleAdd = () => {
    if (disabled) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      variantId,
      variantName,
      unitPrice: product.finalPrice,
      quantity,
    });
    toast.success('Ditambahkan ke keranjang', `${product.name} x${quantity}`);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', fullWidth && 'w-full', className)}>
      {withQuantity ? (
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={maxStock}
          disabled={disabled}
        />
      ) : null}
      <Button
        onClick={handleAdd}
        disabled={disabled}
        size={size}
        variant={variant}
        className={cn(fullWidth && 'flex-1')}
      >
        <ShoppingBag aria-hidden className="h-4 w-4" />
        {disabled ? 'Stok habis' : 'Tambah ke Keranjang'}
      </Button>
    </div>
  );
}

export default AddToCartButton;
