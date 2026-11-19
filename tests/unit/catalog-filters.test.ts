/**
 * Helper filter katalog dipakai bersama oleh Server Component (/products) dan
 * Client Component. Modul ini pernah berada di berkas 'use client' sehingga
 * pemanggilan dari server gagal diam-diam — test ini menjaga kontraknya.
 */
import { describe, it, expect } from 'vitest';
import {
  buildCatalogQuery,
  defaultCatalogFilters,
  filtersFromSearchParams,
} from '@/lib/catalog-filters';

describe('filtersFromSearchParams', () => {
  it('mengembalikan default saat query kosong', () => {
    expect(filtersFromSearchParams(new URLSearchParams())).toEqual(defaultCatalogFilters);
  });

  it('membaca kategori, harga, sort, dan page', () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams({
        category: 'dimsum-udang',
        minPrice: '20000',
        maxPrice: '50000',
        sort: 'price-desc',
        page: '3',
      }),
    );

    expect(filters.category).toBe('dimsum-udang');
    expect(filters.minPrice).toBe('20000');
    expect(filters.maxPrice).toBe('50000');
    expect(filters.sort).toBe('price-desc');
    expect(filters.page).toBe(3);
  });

  it('membaca flag boolean dari "1"', () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams({ promo: '1', bestSeller: '1', newArrival: '1', inStock: '1' }),
    );

    expect(filters.promo).toBe(true);
    expect(filters.bestSeller).toBe(true);
    expect(filters.newArrival).toBe(true);
    expect(filters.inStock).toBe(true);
  });

  it('mengabaikan nilai sort tidak dikenal dan page tidak valid', () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams({ sort: 'termurah', page: '-2' }),
    );

    expect(filters.sort).toBe('popular');
    expect(filters.page).toBe(1);
  });

  it('membatasi panjang kata kunci pencarian', () => {
    const filters = filtersFromSearchParams(new URLSearchParams({ search: 'a'.repeat(200) }));
    expect(filters.search).toHaveLength(80);
  });

  it('mengabaikan flag boolean yang bukan "1"', () => {
    const filters = filtersFromSearchParams(new URLSearchParams({ promo: 'true', inStock: '0' }));
    expect(filters.promo).toBe(false);
    expect(filters.inStock).toBe(false);
  });
});

describe('buildCatalogQuery', () => {
  it('selalu menyertakan perPage dan melewatkan nilai default', () => {
    const query = buildCatalogQuery(defaultCatalogFilters, '');
    const params = new URLSearchParams(query);

    expect(params.get('perPage')).toBeTruthy();
    expect(params.get('sort')).toBeNull();
    expect(params.get('page')).toBeNull();
    expect(params.get('category')).toBeNull();
  });

  it('menyusun query lengkap dengan pencarian yang sudah di-trim pemanggil', () => {
    const params = new URLSearchParams(
      buildCatalogQuery(
        { ...defaultCatalogFilters, category: 'dimsum-mentai', promo: true, sort: 'newest', page: 2 },
        'mentai',
      ),
    );

    expect(params.get('search')).toBe('mentai');
    expect(params.get('category')).toBe('dimsum-mentai');
    expect(params.get('promo')).toBe('1');
    expect(params.get('sort')).toBe('newest');
    expect(params.get('page')).toBe('2');
  });
});
