import { generatePath, matchPath } from 'react-router-dom';
import { TShelterMgmtSegment, TShelterProfileSegment } from './types';

const OPERATOR_BASE = '/operator';

export function routePath(fullPath: string): string {
  return fullPath.startsWith(OPERATOR_BASE)
    ? fullPath.slice(OPERATOR_BASE.length + 1)
    : fullPath;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE PATHS
// ═══════════════════════════════════════════════════════════════════════════════

export const paths = {
  signIn: '/operator/sign-in',
  createOrganization: '/operator/create-organization',
  users: '/operator/users',
  shelter: '/operator/shelter/:shelterId',
  shelterCreate: '/operator/shelter/create',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE METADATA — single source of truth for path segments & param names
// ═══════════════════════════════════════════════════════════════════════════════

type ResourceConfig = {
  path: string;
  param?: string;
};

export const mgmtResources = {
  room: { path: 'rooms', param: 'roomId' },
  bed: { path: 'beds', param: 'bedId' },
  reservation: { path: 'reservations', param: 'reservationId' },
  occupant: { path: 'occupants' },
} as const satisfies Record<string, ResourceConfig>;

export type TMgmtResource = keyof typeof mgmtResources;

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE CONFIGS
// ═══════════════════════════════════════════════════════════════════════════════

type StaticRouteConfig = {
  root: string;
  children: Record<string, string>;
};

type CrudRouteConfig = StaticRouteConfig & {
  actions: Record<string, string>;
};

export const profileRouteConfig = {
  root: '/operator/shelter/:shelterId/profile',
  children: {
    basic: 'basic-info',
    operatingHours: 'operating-hours',
    policies: 'policies',
    details: 'details',
    services: 'services',
    ecosystem: 'ecosystem',
    media: 'media',
  },
} as const satisfies StaticRouteConfig;

export const mgmtRouteConfig = {
  root: '/operator/shelter/:shelterId/manage',
  children: {
    rooms: mgmtResources.room.path,
    beds: mgmtResources.bed.path,
    reservations: mgmtResources.reservation.path,
    occupants: mgmtResources.occupant.path,
  },
  actions: {
    create: 'create',
    edit: ':id/edit',
  },
} as const satisfies CrudRouteConfig;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Manage ────────────────────────────────────────────────────────────────────

export function shelterMgmtRoute(
  shelterId: string,
  segment?: TShelterMgmtSegment,
): string {
  const base = generatePath(mgmtRouteConfig.root, { shelterId });

  return segment ? `${base}/${segment}` : base;
}

/** /operator/shelter/5/manage/beds */
export function shelterMgmtResourceRoute(
  shelterId: string,
  resource: TMgmtResource,
): string {
  return `${shelterMgmtRoute(shelterId)}/${mgmtResources[resource].path}`;
}

/** /operator/shelter/5/manage/beds/create */
export function shelterCreateResourceRoute(
  shelterId: string,
  resource: TMgmtResource,
): string {
  return `${shelterMgmtResourceRoute(shelterId, resource)}/${mgmtRouteConfig.actions.create}`;
}

/** /operator/shelter/5/manage/beds/12/edit */
export function shelterEditResourceRoute(
  shelterId: string,
  resource: TMgmtResource,
  resourceId: string,
): string {
  return generatePath(
    `${shelterMgmtResourceRoute(shelterId, resource)}/${mgmtRouteConfig.actions.edit}`,
    { id: resourceId },
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function shelterProfileRoute(
  shelterId: string,
  segment?: TShelterProfileSegment,
): string {
  const base = generatePath(profileRouteConfig.root, { shelterId });

  return segment ? `${base}/${segment}` : base;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHERS
// ═══════════════════════════════════════════════════════════════════════════════

export function isShelterRoute(path: string, strict?: boolean): boolean {
  if (strict) {
    return Boolean(matchPath(paths.shelter, path));
  }

  return Boolean(matchPath(`${paths.shelter}/*`, path));
}

export function isShelterManageRoute(path: string, strict?: boolean): boolean {
  if (strict) {
    return Boolean(matchPath(mgmtRouteConfig.root, path));
  }

  return Boolean(matchPath(`${mgmtRouteConfig.root}/*`, path));
}

export function isShelterProfileRoute(
  path: string,
  opts?: { strict?: boolean; segment?: TShelterProfileSegment },
): boolean {
  const { strict, segment } = opts ?? {};
  if (segment) {
    return Boolean(matchPath(`${profileRouteConfig.root}/${segment}`, path));
  }

  if (strict) {
    return Boolean(matchPath(profileRouteConfig.root, path));
  }

  return Boolean(matchPath(`${profileRouteConfig.root}/*`, path));
}

export function isShelterMgmtRoute(
  path: string,
  opts?: { strict?: boolean; segment?: TShelterMgmtSegment },
): boolean {
  const { strict, segment } = opts ?? {};
  if (segment) {
    return Boolean(matchPath(`${mgmtRouteConfig.root}/${segment}`, path));
  }

  if (strict) {
    return Boolean(matchPath(mgmtRouteConfig.root, path));
  }

  return Boolean(matchPath(`${mgmtRouteConfig.root}/*`, path));
}
