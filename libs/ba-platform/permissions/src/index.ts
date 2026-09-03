import type { PermissionEnum } from './__generated__';
import * as PermissionGroups from './__generated__';

export * from './__generated__';

// The generated module exports only the ``as const`` permission objects (types
// are erased at runtime), so every runtime export is an object of permission
// strings.  This is the runtime mirror of the ``PermissionEnum`` union.
const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(
  (
    Object.values(PermissionGroups) as unknown as ReadonlyArray<
      Readonly<Record<string, string>>
    >
  ).flatMap((group) => Object.values(group)),
);

/**
 * Whether *value* is a permission the frontend can gate on (a member of
 * ``PermissionEnum``).
 *
 * Guard the boundary where backend permission strings enter the UI
 * (``currentUser.permissions`` and per-org ``permissions`` are typed on the
 * backend as ``app.codename`` strings): a backend permission the frontend does
 * not model must never be cast straight into ``PermissionEnum[]`` state, where
 * a later rename could silently stop gating.  Filtering through this keeps the
 * global/per-org permission sets to exactly what ``hasPermission`` can check.
 */
export const isPermission = (value: string): value is PermissionEnum =>
  KNOWN_PERMISSIONS.has(value);
