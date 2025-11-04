import { readAtPath } from '../../../utils';

type TGetTotalCountFromPath = (incoming: unknown) => number | undefined;

/**
 * Build a getTotalCount function from a path like ["meta","totalCount"]
 */
export function getTotalCountFromPathFn(
  path?: string | ReadonlyArray<string>
): TGetTotalCountFromPath | undefined {
  if (!path) {
    return undefined;
  }

  return function getTotalFromPath(incoming: unknown) {
    const value = readAtPath<unknown>(incoming, path);

    if (typeof value === 'number') {
      return value;
    }

    return undefined;
  };
}
