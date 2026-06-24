/**
 * Checks whether a string value exists in any array-valued property of an object.
 *
 * A low-level set-membership helper — iterates every array property and tests
 * ``arr.includes(value)``.  The caller is responsible for providing meaningful
 * property names.
 *
 * @example
 * ```ts
 * arrayIncludes({ accounts: ['view_users'], shelters: [] }, 'view_users') // true
 * arrayIncludes(undefined, 'view_users') // false
 * ```
 */
export function arrayIncludes<T extends Record<string, unknown>>(
  obj: T | undefined,
  value: string
): boolean {
  if (!obj) return false;

  const { __typename, ...domains } = obj;
  const arrays = Object.values(domains).filter((v): v is string[] =>
    Array.isArray(v)
  );

  return arrays.some((arr) => arr.includes(value));
}
