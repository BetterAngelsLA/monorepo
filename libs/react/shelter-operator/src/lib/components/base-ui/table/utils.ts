import type { SortDirection } from './types';

export function compareValues(
  a: string | number,
  b: string | number,
  direction: SortDirection
): number {
  const multiplier = direction === 'asc' ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }
  return String(a).localeCompare(String(b)) * multiplier;
}
