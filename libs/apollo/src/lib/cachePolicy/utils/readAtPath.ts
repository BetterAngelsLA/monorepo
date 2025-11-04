import { toPathArray } from './toPathArray';

/**
 * Safely reads a nested property from an object using a path.
 *
 * Examples:
 *   readAtPath(obj, ['meta', 'totalCount'])
 *   readAtPath(obj, 'meta.totalCount')
 */
export function readAtPath<T = unknown>(
  value: unknown,
  path?: string | ReadonlyArray<string>
): T | undefined {
  const pathParts = toPathArray(path);

  if (!pathParts) {
    return undefined;
  }

  let current: unknown = value;

  for (const key of pathParts) {
    if (current === null || typeof current !== 'object' || !(key in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}
