import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of `value` that only updates after
 * `delayMs` milliseconds of inactivity.
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * // Bind input to `search`, use `debouncedSearch` for API calls.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}