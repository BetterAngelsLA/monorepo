import { generatePath, matchPath } from 'react-router-dom';

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
  users: '/operator/users',
  dashboardCreate: '/operator/dashboard/create',
  shelter: '/operator/shelter/:shelterId',
  shelterManage: '/operator/shelter/:shelterId/manage',
  shelterProfile: '/operator/shelter/:shelterId/profile',
  shelterReservation: '/operator/shelter/:shelterId/reservation',
  reservation: '/operator/reservation',
} as const;

// ─── SEGMENTS ────────────────────────────────────────────────────────────────

export const manageSegments = {
  rooms: 'rooms',
  beds: 'beds',
  occupancy: 'occupancy',
  label: 'label',
} as const;

export const reservationSegments = {
  addProfile: 'add-profile',
  selectShelter: 'select-shelter',
  selectRoom: 'select-room',
  checkInByDate: 'check-in-by-date',
  confirmation: 'confirmation',
} as const;

// ─── DYNAMIC ROUTE HELPERS ───────────────────────────────────────────────────

export function shelterManageRoute(shelterId: string): string {
  return generatePath(paths.shelterManage, { shelterId });
}

export function shelterProfileRoute(shelterId: string): string {
  return generatePath(paths.shelterProfile, { shelterId });
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

export function isShelterProfileRoute(path: string, strict?: boolean): boolean {
  if (strict) {
    return Boolean(matchPath(paths.shelterProfile, path));
  }
  return Boolean(matchPath(`${paths.shelterProfile}/*`, path));
}
