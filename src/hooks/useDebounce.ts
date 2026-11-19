'use client';

import { useEffect, useState } from 'react';

/**
 * Tunda perubahan nilai selama `delay` milidetik.
 * Dipakai untuk pencarian katalog (debounce 300ms) dan filter harga.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
