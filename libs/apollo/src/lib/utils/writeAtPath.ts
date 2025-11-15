import { toPathArray } from './toPathArray';

/**
 * Safely writes a value into a nested object by path.
 *
 * Returns:
 * - the written value if successful
 * - `undefined` if the path or parent is invalid
 * - `Error` if writing failed (e.g. frozen / read-only object)
 *
 * Example:
 * ```ts
 * const obj = { meta: { totalCount: 10 } };
 * writeAtPath(obj, ['meta', 'totalCount'], 20);
 * // → 20
 * ```
 */

export function writeAtPath(
  target: Record<string, unknown> | undefined,
  path: string | ReadonlyArray<string> | undefined,
  value: unknown
): boolean {
  if (!target || !path) {
    return false;
  }

  const pathParts = toPathArray(path);

  if (!pathParts?.length) {
    return false;
  }

  let current: Record<string, unknown> = target;

  try {
    // walk all but the last segment
    for (let i = 0; i < pathParts.length - 1; i += 1) {
      const key = pathParts[i];
      const next = current[key];

      if (next === undefined || next === null) {
        const child: Record<string, unknown> = {};

        current[key] = child;
        current = child;

        continue;
      }

      if (typeof next !== 'object') {
        return false;
      }

      current = next as Record<string, unknown>;
    }

    const lastKey = pathParts[pathParts.length - 1];

    current[lastKey] = value;

    return true;
  } catch {
    // e.g. frozen object
    return false;
  }
}
