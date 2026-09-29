import { toPathArray } from './toPathArray';

/**
 * withValueAtPath
 *
 * Immutable path-set with structural sharing (copy-on-write along the path).
 * Returns a **new** object with `value` set at `path`, copying only the
 * containers (objects/arrays) along that path and sharing every other
 * sub-tree with the input by reference.
 *
 * Guarantees:
 * • the input is never mutated (safe for frozen or shared objects)
 * • missing (undefined/null) intermediate containers are created
 * • if a path segment resolves to a non-object scalar, no write happens and
 *   the input is returned unchanged
 * • array containers along the path are copied with `slice`, not mutated
 *
 * Example:
 * ```ts
 * const original = { filters: { q: 'x' }, pagination: { offset: 0, limit: 20 } };
 * const next = withValueAtPath(original, ['pagination', 'offset'], 40);
 * // next.pagination → { offset: 40, limit: 20 }  (new object)
 * // next.filters === original.filters             (same reference)
 * // original is untouched
 * ```
 */

export function withValueAtPath<T>(
  target: T,
  path: string | ReadonlyArray<string> | undefined,
  value: unknown,
): T {
  const pathParts = toPathArray(path);

  if (!target || typeof target !== 'object' || !pathParts?.length) {
    return target;
  }

  // Bail out without writing: if any intermediate segment holds a
  // scalar (neither nullish nor an object), the path is invalid → no write.
  let cursor: unknown = target;

  for (let i = 0; i < pathParts.length - 1; i += 1) {
    cursor = (cursor as Record<string, unknown>)[pathParts[i]];

    if (cursor === undefined || cursor === null) {
      break; // missing containers are created by the path write below
    }

    if (typeof cursor !== 'object') {
      return target;
    }
  }

  return writePathClone(target, pathParts, 0, value) as T;
}

function writePathClone(
  node: unknown,
  pathParts: ReadonlyArray<string>,
  index: number,
  value: unknown,
): unknown {
  const container = (node ?? {}) as Record<string, unknown>;

  const clone: Record<string, unknown> = Array.isArray(container)
    ? (container.slice() as unknown as Record<string, unknown>)
    : { ...container };

  const key = pathParts[index];

  if (index === pathParts.length - 1) {
    clone[key] = value;

    return clone;
  }

  clone[key] = writePathClone(container[key], pathParts, index + 1, value);

  return clone;
}
