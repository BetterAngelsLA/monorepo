import { readAtPath } from '../../../utils';

/**
 * Build a getItemId function from a path on the item.
 * Example:
 *   const getItemId = getItemIdFromPathFn('personalId');
 *   const id = getItemId(item, readField);
 */
export type TGetItemIdFromPath<TItem> = (
  item: TItem
) => string | number | null | undefined;

export function getItemIdFromPathFn<TItem>(
  path?: string | ReadonlyArray<string>
): TGetItemIdFromPath<TItem> | undefined {
  if (!path) {
    return undefined;
  }

  return function getItemIdFromPath(
    item: TItem
  ): string | number | null | undefined {
    const value = readAtPath<unknown>(item, path);

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return null;
  };
}
