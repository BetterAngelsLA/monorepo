/**
 * Generic utility that checks whether a string value exists in any of the
 * array-valued properties of an object.
 *
 * This is a low-level helper — it does **not** enforce authorization rules.
 * It simply tests set membership: ``arr.includes(permission)`` across every
 * array property of the provided object.
 *
 * Both BA Admin and Shelter Operator have identical OrgPermissions shapes:
 * ``{ __typename?: string, accounts: string[], reports: string[], shelters: string[] }``
 *
 * @example
 * ```ts
 * hasPermission({ accounts: ['view_users'], shelters: [] }, 'view_users') // true
 * hasPermission(undefined, 'view_users') // false
 * ```
 */
export function hasPermission<T extends Record<string, unknown>>(
  permissions: T | undefined,
  permission: string
): boolean {
  if (!permissions) return false;

  const { __typename, ...domains } = permissions;
  const arrays = Object.values(domains).filter((v): v is string[] =>
    Array.isArray(v)
  );

  return arrays.some((arr) => arr.includes(permission));
}
