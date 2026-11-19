/**
 * Filter katalog /products — helper murni (tanpa React) sehingga dapat dipakai
 * baik oleh Server Component (membaca filter awal dari query string untuk tautan
 * yang dibagikan) maupun Client Component (menyusun query ke /api/products).
 *
 * Jangan tambahkan 'use client' atau hook React di berkas ini.
 */
import { CATALOG_PAGE_SIZE, SORT_OPTIONS, type SortOption } from '@/lib/constants';

export type CatalogFilters = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  bestSeller: boolean;
  promo: boolean;
  newArrival: boolean;
  inStock: boolean;
  sort: SortOption;
  page: number;
};

export const defaultCatalogFilters: CatalogFilters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  bestSeller: false,
  promo: false,
  newArrival: false,
  inStock: false,
  sort: 'popular',
  page: 1,
};

const VALID_SORTS: SortOption[] = SORT_OPTIONS.map((option) => option.value);

/** Bangun filter awal dari query string URL (untuk tautan yang dibagikan). */
export function filtersFromSearchParams(params: URLSearchParams): CatalogFilters {
  const sortParam = params.get('sort');
  const sort = VALID_SORTS.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : defaultCatalogFilters.sort;
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    search: (params.get('search') ?? '').slice(0, 80),
    category: (params.get('category') ?? '').slice(0, 80),
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    bestSeller: params.get('bestSeller') === '1',
    promo: params.get('promo') === '1',
    newArrival: params.get('newArrival') === '1',
    inStock: params.get('inStock') === '1',
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Susun query string untuk GET /api/products berdasarkan filter aktif. */
export function buildCatalogQuery(filters: CatalogFilters, search: string): string {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filters.category) params.set('category', filters.category);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.bestSeller) params.set('bestSeller', '1');
  if (filters.promo) params.set('promo', '1');
  if (filters.newArrival) params.set('newArrival', '1');
  if (filters.inStock) params.set('inStock', '1');
  if (filters.sort !== defaultCatalogFilters.sort) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  params.set('perPage', String(CATALOG_PAGE_SIZE));
  return params.toString();
}
