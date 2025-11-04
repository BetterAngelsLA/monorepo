import { readAtPath } from '../../../utils';

type TGetItemsFromPath<TItem> = (
  incoming: unknown
) => ReadonlyArray<TItem> | undefined;

/**
 * Build a getItems function from a path like "items" or ["data","items"]
 */
export function getItemsFromPathFn<TItem>(
  path?: string | ReadonlyArray<string>
): TGetItemsFromPath<TItem> | undefined {
  if (!path) {
    return undefined;
  }

  return function getItemsFromPath(incoming: unknown) {
    const value = readAtPath<unknown>(incoming, path);

    if (Array.isArray(value)) {
      return value as ReadonlyArray<TItem>;
    }

    return undefined;
  };
}
