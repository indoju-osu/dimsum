'use client';

/**
 * State katalog produk untuk halaman /products.
 *
 * - Filter disimpan di state klien dan disinkronkan ke URL memakai
 *   history.replaceState (tanpa navigasi ulang) sehingga link dapat dibagikan
 *   dan tombol back browser tidak menumpuk riwayat.
 * - Pencarian di-debounce 300ms sebelum dikirim ke /api/products.
 * - Harga & stok selalu berasal dari server (respons API), bukan dari client.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';
import {
  buildCatalogQuery,
  defaultCatalogFilters,
  filtersFromSearchParams,
  type CatalogFilters,
} from '@/lib/catalog-filters';
import type { ProductListItem } from '@/types';

export type { CatalogFilters };
// Helper murni dipakai juga oleh Server Component (src/app/(public)/products/page.tsx),
// sehingga implementasinya berada di src/lib/catalog-filters.ts dan hanya diteruskan di sini.
export { buildCatalogQuery, defaultCatalogFilters, filtersFromSearchParams };

export type CatalogState = {
  items: ProductListItem[];
  total: number;
  totalPages: number;
  page: number;
  loading: boolean;
  error: string | null;
};

export function useCatalog(initialFilters: CatalogFilters = defaultCatalogFilters) {
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [state, setState] = useState<CatalogState>({
    items: [],
    total: 0,
    totalPages: 1,
    page: 1,
    loading: true,
    error: null,
  });
  const debouncedSearch = useDebounce(filters.search, 300);
  const abortRef = useRef<AbortController | null>(null);

  const queryString = useMemo(
    () => buildCatalogQuery(filters, debouncedSearch.trim()),
    [filters, debouncedSearch],
  );

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));

    fetch(`/api/products?${queryString}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Gagal memuat produk');
        return (await response.json()) as {
          items: ProductListItem[];
          total: number;
          page: number;
          totalPages: number;
        };
      })
      .then((data) => {
        setState({
          items: data.items,
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState((current) => ({
          ...current,
          loading: false,
          error: 'Tidak dapat memuat daftar produk. Silakan coba lagi.',
        }));
      });

    return () => controller.abort();
  }, [queryString]);

  // Sinkronkan ke address bar tanpa memicu navigasi Next.js.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.search = queryString;
    window.history.replaceState(null, '', url.toString());
  }, [queryString]);

  const updateFilters = useCallback((patch: Partial<CatalogFilters>) => {
    setFilters((current) => {
      const resetPage = Object.keys(patch).some((key) => key !== 'page');
      return { ...current, ...patch, page: resetPage && patch.page === undefined ? 1 : (patch.page ?? current.page) };
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(defaultCatalogFilters), []);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.category !== '',
        filters.minPrice !== '',
        filters.maxPrice !== '',
        filters.bestSeller,
        filters.promo,
        filters.newArrival,
        filters.inStock,
        filters.search !== '',
      ].filter(Boolean).length,
    [filters],
  );

  return {
    filters,
    state,
    updateFilters,
    resetFilters,
    activeFilterCount,
    debouncedSearch,
    isSearching: filters.search !== debouncedSearch,
  };
}

export default useCatalog;
