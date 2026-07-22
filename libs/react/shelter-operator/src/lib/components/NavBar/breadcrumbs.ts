import { formatClientDisplayName } from '@monorepo/react/shared';
import { useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import {
  useBed,
  useReservation,
  useRoom,
  useShelterOperatorProfile,
} from '../../hooks';
import { mgmtRouteConfig, paths, profileRouteConfig } from '../../routing';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BreadcrumbItem = {
  label: string;
  path: string;
};

// ─── Segment label map ───────────────────────────────────────────────────────

const segmentLabels: Record<string, string> = {
  manage: 'Manage',
  rooms: 'Rooms',
  beds: 'Beds',
  reservations: 'Reservations',
  occupants: 'Occupants',
  profile: 'Profile',
  create: 'Create',
  edit: 'Edit',
  signIn: 'Sign In',
  users: 'Users',
  [profileRouteConfig.children.basic]: 'Basic Info',
  [profileRouteConfig.children.operatingHours]: 'Hours',
  [profileRouteConfig.children.policies]: 'Policies',
  [profileRouteConfig.children.details]: 'Details',
  [profileRouteConfig.children.services]: 'Services',
  [profileRouteConfig.children.ecosystem]: 'Ecosystem',
  [profileRouteConfig.children.media]: 'Media',
};

/** Replace `:paramName` segments in a path pattern with values from params. */
function buildPath(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/:(\w+)/g, (_, key) => params[key] ?? `:${key}`);
}

// ─── Route pattern → breadcrumb builder ──────────────────────────────────────

interface RoutePattern {
  /** react-router-dom path pattern (full, with /operator prefix) */
  pattern: string;
  /**
   * Build breadcrumb segments from matched params.
   * Return an array of { label, path } where the label is either
   * a static string or a dynamic ID placeholder (e.g. "__shelterId__").
   * Placeholders get resolved to names by the hook.
   */
  build: (params: Record<string, string>) => BreadcrumbItem[];
}

/**
 * Ordered from most specific to least specific so matchPath finds
 * the deepest match first.
 */
const routePatterns: RoutePattern[] = [
  // ── Reservations ─────────────────────────────────────────────────────────
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.reservations}/${mgmtRouteConfig.actions.edit}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      {
        label: 'Reservations',
        path: buildPath(
          `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.reservations}`,
          params,
        ),
      },
      { label: `__reservationId__:${params.id}`, path: '#' },
      { label: 'Edit', path: '#' },
    ],
  },
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.reservations}/${mgmtRouteConfig.actions.create}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      {
        label: 'Reservations',
        path: buildPath(
          `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.reservations}`,
          params,
        ),
      },
      { label: 'Create', path: '#' },
    ],
  },
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.reservations}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      { label: 'Reservations', path: '#' },
    ],
  },
  // ── Beds ─────────────────────────────────────────────────────────────────
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.beds}/${mgmtRouteConfig.actions.edit}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      {
        label: 'Beds',
        path: buildPath(
          `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.beds}`,
          params,
        ),
      },
      { label: `__bedId__:${params.id}`, path: '#' },
      { label: 'Edit', path: '#' },
    ],
  },
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.beds}/${mgmtRouteConfig.actions.create}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      {
        label: 'Beds',
        path: buildPath(
          `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.beds}`,
          params,
        ),
      },
      { label: 'Create', path: '#' },
    ],
  },
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.beds}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      { label: 'Beds', path: '#' },
    ],
  },
  // ── Rooms ────────────────────────────────────────────────────────────────
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.rooms}/${mgmtRouteConfig.actions.edit}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      {
        label: 'Rooms',
        path: buildPath(
          `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.rooms}`,
          params,
        ),
      },
      { label: `__roomId__:${params.id}`, path: '#' },
      { label: 'Edit', path: '#' },
    ],
  },
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.rooms}/${mgmtRouteConfig.actions.create}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      {
        label: 'Rooms',
        path: buildPath(
          `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.rooms}`,
          params,
        ),
      },
      { label: 'Create', path: '#' },
    ],
  },
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.rooms}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      { label: 'Rooms', path: '#' },
    ],
  },
  // ── Occupants ────────────────────────────────────────────────────────────
  {
    pattern: `${mgmtRouteConfig.root}/${mgmtRouteConfig.children.occupants}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: buildPath(mgmtRouteConfig.root, params) },
      { label: 'Occupants', path: '#' },
    ],
  },
  // ── Manage (root) ────────────────────────────────────────────────────────
  {
    pattern: mgmtRouteConfig.root,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Manage', path: '#' },
    ],
  },
  // ── Profile sub-segments ─────────────────────────────────────────────────
  ...Object.values(profileRouteConfig.children).map((segment) => ({
    pattern: `${profileRouteConfig.root}/${segment}`,
    build: (params: Record<string, string>) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Profile', path: buildPath(profileRouteConfig.root, params) },
      { label: segmentLabels[segment] ?? segment, path: '#' },
    ],
  })),
  // ── Profile (root) ───────────────────────────────────────────────────────
  {
    pattern: profileRouteConfig.root,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(mgmtRouteConfig.root, params),
      },
      { label: 'Profile', path: '#' },
    ],
  },
  // ── Users ────────────────────────────────────────────────────────────────
  {
    pattern: paths.users,
    build: () => [{ label: 'Users', path: '#' }],
  },
];

// ─── ID placeholder helpers ──────────────────────────────────────────────────

const ID_SEPARATOR = '__:';

function parseIdPlaceholder(
  label: string,
): { type: string; id: string } | null {
  const idx = label.indexOf(ID_SEPARATOR);
  if (idx === -1) return null;
  return {
    type: label.slice(2, idx), // strip "__" prefix
    id: label.slice(idx + ID_SEPARATOR.length),
  };
}

// ─── Main parsing function ───────────────────────────────────────────────────

/**
 * Parse the current pathname into breadcrumb items.
 * Returns empty array for routes that don't need breadcrumbs (dashboard).
 */
export function parseBreadcrumbs(pathname: string): BreadcrumbItem[] {
  for (const { pattern, build } of routePatterns) {
    const match = matchPath(pattern, pathname);
    if (match) {
      return build(match.params as Record<string, string>);
    }
  }
  return [];
}

// ─── Name resolution hook ────────────────────────────────────────────────────

interface UseBreadcrumbNamesResult {
  /** Breadcrumb items with resolved names (or "..." while placeholder names are loading). */
  items: BreadcrumbItem[];
  /** True while any dynamic ID placeholder names are still being fetched. */
  loading: boolean;
}

/**
 * Takes parsed breadcrumbs and resolves dynamic ID placeholders
 * to human-readable names via GraphQL queries.
 */
export function useBreadcrumbNames(
  rawItems: BreadcrumbItem[],
): UseBreadcrumbNamesResult {
  // Extract dynamic IDs from raw breadcrumb items
  const { shelterId, roomId, bedId, reservationId } = useMemo(() => {
    const ids: {
      shelterId?: string;
      roomId?: string;
      bedId?: string;
      reservationId?: string;
    } = {};
    for (const item of rawItems) {
      const parsed = parseIdPlaceholder(item.label);
      if (!parsed) continue;
      switch (parsed.type) {
        case 'shelterId':
          ids.shelterId = parsed.id;
          break;
        case 'roomId':
          ids.roomId = parsed.id;
          break;
        case 'bedId':
          ids.bedId = parsed.id;
          break;
        case 'reservationId':
          ids.reservationId = parsed.id;
          break;
      }
    }
    return ids;
  }, [rawItems]);

  // Conditionally fetch names (destructure loading flags for aggregation)
  const { shelter: operatorShelter, loading: shelterLoading } =
    useShelterOperatorProfile(shelterId ?? '');
  const { bed, loading: bedLoading } = useBed(bedId ?? '');
  const { reservation, loading: reservationLoading } = useReservation(
    reservationId ?? '',
  );
  const { room, loading: roomLoading } = useRoom(roomId ?? '');

  const loadingByKind: Record<string, boolean> = useMemo(
    () => ({
      shelterId: shelterLoading,
      bedId: bedLoading,
      reservationId: reservationLoading,
      roomId: roomLoading,
    }),
    [shelterLoading, bedLoading, reservationLoading, roomLoading],
  );

  // True if any dynamic placeholder is still being fetched
  const loading =
    shelterLoading || bedLoading || reservationLoading || roomLoading;

  // Build name lookup
  const nameMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (operatorShelter?.id && operatorShelter.name) {
      map[`__shelterId__:${operatorShelter.id}`] = operatorShelter.name;
    }
    if (room?.id && room?.name) {
      map[`__roomId__:${room.id}`] = room.name;
    }
    if (bed?.id) {
      map[`__bedId__:${bed.id}`] = bed.name ?? bed.id;
    }
    if (reservation?.id) {
      const clients = reservation.clients;
      const primary = clients.find((c) => c.isPrimary) ?? clients[0];
      const primaryName = primary?.clientProfile
        ? formatClientDisplayName(primary.clientProfile)
        : '';
      const truncatedName =
        primaryName.length > 15
          ? primaryName.slice(0, 15) + '...'
          : primaryName;
      const suffix = clients.length > 1 ? ` +${clients.length - 1}` : '';
      map[`__reservationId__:${reservation.id}`] =
        `${truncatedName}${suffix}` || 'Reservation';
    }

    return map;
  }, [operatorShelter, room, bed, reservation]);

  // Resolve progressively: show resolved names immediately; "..." only while
  // that specific placeholder's fetch is still in flight.
  const items = useMemo(() => {
    return rawItems.map((item) => {
      const resolved = nameMap[item.label];
      if (resolved) {
        return { ...item, label: resolved };
      }
      const placeholder = parseIdPlaceholder(item.label);
      if (placeholder && loadingByKind[placeholder.type]) {
        return { ...item, label: '...' };
      }
      return item;
    });
  }, [rawItems, nameMap, loadingByKind]);

  return { items, loading };
}
