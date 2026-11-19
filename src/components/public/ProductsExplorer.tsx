'use client';

import { useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/Button';
import { Input, Select, Checkbox, Field } from '@/components/ui/FormControls';
import { EmptyState, Skeleton } from '@/components/ui/Misc';
import { useCatalog, type CatalogFilters } from '@/hooks/useCatalog';
import { SORT_OPTIONS } from '@/lib/constants';
import { formatRupiah } from '@/lib/format';
import type { CategorySummary } from '@/types';

/**
 * Katalog produk interaktif: pencarian (debounce 300ms), filter kategori/harga/
 * label, pengurutan, grid responsif 2/3/4 kolom, dan tombol reset.
 * Data selalu dimuat dari /api/products (harga & stok berasal dari server).
 */
export function ProductsExplorer({
  categories,
  initialFilters,
  priceRange,
}: {
  categories: CategorySummary[];
  initialFilters: CatalogFilters;
  priceRange: { min: number; max: number };
}) {
  const { filters, state, updateFilters, resetFilters, activeFilterCount, isSearching } =
    useCatalog(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const filterPanel = (
    <div className="space-y-5">
      <Field label="Kata kunci" htmlFor="filter-search">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/50"
          />
          <Input
            id="filter-search"
            type="search"
            inputMode="search"
            placeholder="Cari dimsum, paket, saus..."
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            className="pl-9"
            maxLength={80}
          />
        </div>
      </Field>

      <Field label="Kategori" htmlFor="filter-category">
        <Select
          id="filter-category"
          value={filters.category}
          onChange={(event) => updateFilters({ category: event.target.value })}
        >
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-forest">Rentang harga</legend>
        <div className="flex items-center gap-2">
          <Field label="Minimal" htmlFor="filter-min" className="flex-1">
            <Input
              id="filter-min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={String(priceRange.min)}
              value={filters.minPrice}
              onChange={(event) => updateFilters({ minPrice: event.target.value })}
            />
          </Field>
          <Field label="Maksimal" htmlFor="filter-max" className="flex-1">
            <Input
              id="filter-max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={String(priceRange.max)}
              value={filters.maxPrice}
              onChange={(event) => updateFilters({ maxPrice: event.target.value })}
            />
          </Field>
        </div>
        <p className="text-xs text-charcoal/70">
          Harga produk saat ini {formatRupiah(priceRange.min)} – {formatRupiah(priceRange.max)}.
        </p>
      </fieldset>

      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-medium text-forest">Label produk</legend>
        <Checkbox
          id="filter-bestseller"
          label="Favorit pelanggan"
          checked={filters.bestSeller}
          onChange={(event) => updateFilters({ bestSeller: event.target.checked })}
        />
        <Checkbox
          id="filter-promo"
          label="Sedang promo"
          checked={filters.promo}
          onChange={(event) => updateFilters({ promo: event.target.checked })}
        />
        <Checkbox
          id="filter-new"
          label="Produk baru"
          checked={filters.newArrival}
          onChange={(event) => updateFilters({ newArrival: event.target.checked })}
        />
        <Checkbox
          id="filter-stock"
          label="Hanya yang tersedia"
          checked={filters.inStock}
          onChange={(event) => updateFilters({ inStock: event.target.checked })}
        />
      </fieldset>

      <Button variant="outline" className="w-full" onClick={resetFilters}>
        <RotateCcw aria-hidden className="h-4 w-4" />
        Reset filter
      </Button>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-stone bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg text-forest">
            <Filter aria-hidden className="h-4 w-4" />
            Filter
          </h2>
          {filterPanel}
        </div>
      </aside>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-charcoal/80">
              {state.loading ? (
                'Memuat produk…'
              ) : (
                <>
                  Menampilkan <strong className="text-forest">{state.items.length}</strong> dari{' '}
                  <strong className="text-forest">{state.total}</strong> produk
                </>
              )}
            </p>
            {activeFilterCount > 0 ? (
              <p className="text-xs text-olive">{activeFilterCount} filter aktif</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal aria-hidden className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
            <Field label="Urutkan" htmlFor="filter-sort" className="flex flex-row items-center gap-2 space-y-0">
              <Select
                id="filter-sort"
                value={filters.sort}
                onChange={(event) =>
                  updateFilters({ sort: event.target.value as CatalogFilters['sort'] })
                }
                className="w-[190px]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        {showFilters ? (
          <div className="rounded-3xl border border-stone bg-white p-5 shadow-soft lg:hidden">
            {filterPanel}
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {state.loading || isSearching ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : state.items.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description="Coba ubah kata kunci, kategori, atau rentang harga. Anda juga dapat mereset semua filter."
            action={
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw aria-hidden className="h-4 w-4" />
                Reset filter
              </Button>
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {state.items.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={index < 4} />
                </li>
              ))}
            </ul>

            {state.totalPages > 1 ? (
              <nav
                aria-label="Navigasi halaman katalog"
                className="flex items-center justify-center gap-2 pt-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.page <= 1}
                  onClick={() => updateFilters({ page: state.page - 1 })}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-charcoal/80">
                  Halaman {state.page} dari {state.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.page >= state.totalPages}
                  onClick={() => updateFilters({ page: state.page + 1 })}
                >
                  Berikutnya
                </Button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default ProductsExplorer;
