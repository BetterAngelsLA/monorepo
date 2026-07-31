import { DropdownOption } from '../types';

/**
 * Converts an enum display map to DropdownOption[].
 *
 * @param map     - Record mapping enum values to display labels.
 * @param options - Optional ordering config.
 *   - `head`: keys to place at the beginning.
 *   - `tail`: keys to place at the end.
 *   - Remaining keys appear in the middle (object key order).
 *   - Pass a plain array as shorthand for `{ tail: [...] }`.
 *
 * @example
 * // Default order (follows object key insertion order)
 * toDropdownOptions(enumDisplayAccessibilityChoices);
 *
 * @example
 * // Pin "No Storage" to the end (shorthand)
 * toDropdownOptions(enumDisplayStorageChoices, [StorageChoices.NoStorage]);
 *
 * @example
 * // Pin "Approved" to the top
 * toDropdownOptions(enumStatusChoices, {
 *   head: [StatusChoices.Approved],
 * });
 *
 * @example
 * // Pin "No Storage" to the end (explicit)
 * toDropdownOptions(enumDisplayStorageChoices, {
 *   tail: [StorageChoices.NoStorage],
 * });
 */
export function toDropdownOptions<T extends string | number>(
  map: Record<T, string>,
  options?: T[] | { head?: T[]; tail?: T[] }
): DropdownOption<T>[] {
  const entries = Object.entries(map) as [T, string][];

  if (!options) {
    return entries.map(([value, label]) => ({ value, label }));
  }

  const { head = [], tail = [] } = Array.isArray(options)
    ? { head: [], tail: options }
    : options;

  const all = new Map(entries);
  const pinned = new Set([...head, ...tail]);

  const headOptions: DropdownOption<T>[] = head.map((key) => ({
    value: key,
    label: all.get(key) ?? '',
  }));

  const middle: DropdownOption<T>[] = entries
    .filter(([value]) => !pinned.has(value))
    .map(([value, label]) => ({ value, label }));

  const tailOptions: DropdownOption<T>[] = tail.map((key) => ({
    value: key,
    label: all.get(key) ?? '',
  }));

  return [...headOptions, ...middle, ...tailOptions];
}
