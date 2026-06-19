/**
 * Generic permission check that works with any OrgPermissions-shaped object.
 *
 * Both BA Admin and Shelter Operator have identical OrgPermissions shapes:
 * `{ __typename?: string, accounts: string[], reports: string[], shelters: string[] }`
 *
 * This utility extracts all permission arrays and checks if `permission` is present.
 */
export function hasPermission<T extends Record<string, unknown>>(
  permissions: T | undefined,
  permission: string
): boolean {
  if (!permissions) return false;

  const { __typename, ...domains } = permissions;
  const arrays = Object.values(domains).filter(
    (v): v is string[] => Array.isArray(v)
  );

  return arrays.some((arr) => arr.includes(permission));
}
