/**
 * Returns the last key segment from a path.
 *
 * Examples:
 *   'meta.totalCount'        → 'totalCount'
 *   ['meta', 'totalCount']   → 'totalCount'
 *   undefined                → undefined
 */

import { toPathArray } from './toPathArray';

export function getLastPathSegment(
  path?: string | ReadonlyArray<string>
): string | undefined {
  const pathParts = toPathArray(path);

  if (!pathParts?.length) {
    return undefined;
  }

  return pathParts[pathParts.length - 1];
}
