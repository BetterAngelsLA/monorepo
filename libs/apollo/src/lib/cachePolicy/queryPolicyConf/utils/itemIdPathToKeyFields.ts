import { toPathArray } from '../../utils/toPathArray';

/**
 * Convert an itemIdPath (string or path array) to Apollo keyFields.
 * Example: "meta.client.id" → ["id"]
 */
export function itemIdPathToKeyFields(
  itemIdPath?: string | ReadonlyArray<string>
): string[] | undefined {
  if (!itemIdPath) {
    return undefined;
  }

  const pathParts = toPathArray(itemIdPath);

  if (!pathParts || pathParts.length === 0) {
    return undefined;
  }

  const lastKey = pathParts[pathParts.length - 1];

  return [lastKey];
}
