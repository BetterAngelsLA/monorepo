import { generatePath, matchPath } from 'react-router-dom';
import { TShelterProfileSegment } from './types';

const OPERATOR_BASE = '/operator';

/** Strips the /operator prefix for use in <Route path> */
export function routePath(fullPath: string): string {
  return fullPath.startsWith(OPERATOR_BASE)
    ? fullPath.slice(OPERATOR_BASE.length + 1)
    : fullPath;
}

// ─── FULL PATHS ──────────────────────────────────────────────────────────────

export const paths = {
  signIn: '/operator/sign-in',
  createOrganization: '/operator/create-organization',
  users: '/operator/users',
  shelter: '/operator/shelter/:shelterId',
  shelterCreate: '/operator/shelter/create',
  shelterManage: '/operator/shelter/:shelterId/manage',
  shelterProfile: '/operator/shelter/:shelterId/profile',
} as const;

// ─── SEGMENTS ────────────────────────────────────────────────────────────────
export const shelterProfileSegments = {
  basic: 'basic-info',
  operatingHours: 'operating-hours',
  policies: 'policies',
  details: 'details',
  services: 'services',
  ecosystem: 'ecosystem',
  media: 'media',
} as const;

export const manageSegments = {
  rooms: 'rooms',
  roomsCreate: 'rooms/create',
  roomsEdit: 'rooms/:roomId/edit',
  beds: 'beds',
  bedsCreate: 'beds/create',
  bedsEdit: 'beds/:bedId/edit',
  reservations: 'reservations',
  reservationsCreate: 'reservations/create',
  reservationsEdit: 'reservations/:reservationId/edit',
  occupants: 'occupants',
} as const;

// ─── DYNAMIC ROUTE HELPERS ───────────────────────────────────────────────────

export function shelterManageRoute(shelterId: string): string {
  return generatePath(paths.shelterManage, { shelterId });
}

export function shelterManageRoomsRoute(shelterId: string): string {
  return `${shelterManageRoute(shelterId)}/${manageSegments.rooms}`;
}

export function shelterCreateRoomRoute(shelterId: string): string {
  return `${shelterManageRoute(shelterId)}/${manageSegments.roomsCreate}`;
}

export function shelterEditRoomRoute(
  shelterId: string,
  roomId: string
): string {
  return generatePath(`${paths.shelterManage}/${manageSegments.roomsEdit}`, {
    shelterId,
    roomId,
  });
}

export function shelterManageBedsRoute(shelterId: string): string {
  return `${shelterManageRoute(shelterId)}/${manageSegments.beds}`;
}

export function shelterCreateBedRoute(shelterId: string): string {
  return `${shelterManageRoute(shelterId)}/${manageSegments.bedsCreate}`;
}

export function shelterEditBedRoute(shelterId: string, bedId: string): string {
  return generatePath(`${paths.shelterManage}/${manageSegments.bedsEdit}`, {
    shelterId,
    bedId,
  });
}

export function shelterManageReservationsRoute(shelterId: string): string {
  return `${shelterManageRoute(shelterId)}/${manageSegments.reservations}`;
}

export function shelterCreateReservationRoute(shelterId: string): string {
  return `${shelterManageRoute(shelterId)}/${
    manageSegments.reservationsCreate
  }`;
}

export function shelterEditReservationRoute(
  shelterId: string,
  reservationId: string
): string {
  return generatePath(
    `${paths.shelterManage}/${manageSegments.reservationsEdit}`,
    { shelterId, reservationId }
  );
}

export function shelterProfileRoute(
  shelterId: string,
  segment?: TShelterProfileSegment
): string {
  const base = generatePath(paths.shelterProfile, { shelterId });

  return segment ? `${base}/${segment}` : base;
}

export function isShelterRoute(path: string, strict?: boolean): boolean {
  if (strict) {
    return Boolean(matchPath(paths.shelter, path));
  }

  return Boolean(matchPath(`${paths.shelter}/*`, path));
}

export function isShelterManageRoute(path: string, strict?: boolean): boolean {
  if (strict) {
    return Boolean(matchPath(paths.shelterManage, path));
  }

  return Boolean(matchPath(`${paths.shelterManage}/*`, path));
}

export function isShelterProfileRoute(
  path: string,
  opts?: { strict?: boolean; segment?: TShelterProfileSegment }
): boolean {
  const { strict, segment } = opts ?? {};
  if (segment) {
    return Boolean(matchPath(`${paths.shelterProfile}/${segment}`, path));
  }

  if (strict) {
    return Boolean(matchPath(paths.shelterProfile, path));
  }

  return Boolean(matchPath(`${paths.shelterProfile}/*`, path));
}
