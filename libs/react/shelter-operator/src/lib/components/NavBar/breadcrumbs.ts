import { useQuery } from '@apollo/client/react';
import { formatClientDisplayName } from '@monorepo/react/shared';
import { useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import { manageSegments, paths, shelterProfileSegments } from '../../routing';
import {
  GetBedDocument,
  type GetBedQuery,
  type GetBedQueryVariables,
} from '../beds/api/__generated__/bedQueries.generated';
import {
  GetShelterOperatorOverviewDocument,
  type GetShelterOperatorOverviewQuery,
  type GetShelterOperatorOverviewQueryVariables,
} from '../overview/__generated__/overview.generated';
import {
  GetReservationDocument,
  type GetReservationQuery,
  type GetReservationQueryVariables,
} from '../reservations/api/__generated__/reservationQueries.generated';
import {
  GetRoomDocument,
  type GetRoomQuery,
  type GetRoomQueryVariables,
} from '../rooms/api/__generated__/roomQueries.generated';

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
  [shelterProfileSegments.basic]: 'Basic Info',
  [shelterProfileSegments.operatingHours]: 'Hours',
  [shelterProfileSegments.policies]: 'Policies',
  [shelterProfileSegments.details]: 'Details',
  [shelterProfileSegments.services]: 'Services',
  [shelterProfileSegments.ecosystem]: 'Ecosystem',
  [shelterProfileSegments.media]: 'Media',
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
    pattern: `${paths.shelterManage}/${manageSegments.reservationsEdit}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      {
        label: 'Reservations',
        path: buildPath(
          `${paths.shelterManage}/${manageSegments.reservations}`,
          params
        ),
      },
      { label: `__reservationId__:${params.reservationId}`, path: '#' },
      { label: 'Edit', path: '#' },
    ],
  },
  {
    pattern: `${paths.shelterManage}/${manageSegments.reservationsCreate}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      {
        label: 'Reservations',
        path: buildPath(
          `${paths.shelterManage}/${manageSegments.reservations}`,
          params
        ),
      },
      { label: 'Create', path: '#' },
    ],
  },
  {
    pattern: `${paths.shelterManage}/${manageSegments.reservations}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      { label: 'Reservations', path: '#' },
    ],
  },
  // ── Beds ─────────────────────────────────────────────────────────────────
  {
    pattern: `${paths.shelterManage}/${manageSegments.bedsEdit}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      {
        label: 'Beds',
        path: buildPath(
          `${paths.shelterManage}/${manageSegments.beds}`,
          params
        ),
      },
      { label: `__bedId__:${params.bedId}`, path: '#' },
      { label: 'Edit', path: '#' },
    ],
  },
  {
    pattern: `${paths.shelterManage}/${manageSegments.bedsCreate}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      {
        label: 'Beds',
        path: buildPath(
          `${paths.shelterManage}/${manageSegments.beds}`,
          params
        ),
      },
      { label: 'Create', path: '#' },
    ],
  },
  {
    pattern: `${paths.shelterManage}/${manageSegments.beds}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      { label: 'Beds', path: '#' },
    ],
  },
  // ── Rooms ────────────────────────────────────────────────────────────────
  {
    pattern: `${paths.shelterManage}/${manageSegments.roomsEdit}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      {
        label: 'Rooms',
        path: buildPath(
          `${paths.shelterManage}/${manageSegments.rooms}`,
          params
        ),
      },
      { label: `__roomId__:${params.roomId}`, path: '#' },
      { label: 'Edit', path: '#' },
    ],
  },
  {
    pattern: `${paths.shelterManage}/${manageSegments.roomsCreate}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      {
        label: 'Rooms',
        path: buildPath(
          `${paths.shelterManage}/${manageSegments.rooms}`,
          params
        ),
      },
      { label: 'Create', path: '#' },
    ],
  },
  {
    pattern: `${paths.shelterManage}/${manageSegments.rooms}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      { label: 'Rooms', path: '#' },
    ],
  },
  // ── Occupants ────────────────────────────────────────────────────────────
  {
    pattern: `${paths.shelterManage}/${manageSegments.occupants}`,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: buildPath(paths.shelterManage, params) },
      { label: 'Occupants', path: '#' },
    ],
  },
  // ── Manage (root) ────────────────────────────────────────────────────────
  {
    pattern: paths.shelterManage,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Manage', path: '#' },
    ],
  },
  // ── Profile sub-segments ─────────────────────────────────────────────────
  ...Object.values(shelterProfileSegments).map((segment) => ({
    pattern: `${paths.shelterProfile}/${segment}`,
    build: (params: Record<string, string>) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
      },
      { label: 'Profile', path: buildPath(paths.shelterProfile, params) },
      { label: segmentLabels[segment] ?? segment, path: '#' },
    ],
  })),
  // ── Profile (root) ───────────────────────────────────────────────────────
  {
    pattern: paths.shelterProfile,
    build: (params) => [
      {
        label: `__shelterId__:${params.shelterId}`,
        path: buildPath(paths.shelterManage, params),
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
  label: string
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
  /** Breadcrumb items with resolved names (or raw ID as fallback while loading). */
  items: BreadcrumbItem[];
}

/**
 * Takes parsed breadcrumbs and resolves dynamic ID placeholders
 * to human-readable names via GraphQL queries.
 */
export function useBreadcrumbNames(
  rawItems: BreadcrumbItem[]
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

  // Conditionally fetch names
  const { data: shelterData } = useQuery<
    GetShelterOperatorOverviewQuery,
    GetShelterOperatorOverviewQueryVariables
  >(GetShelterOperatorOverviewDocument, {
    variables: { shelterId: shelterId ?? '' },
    skip: !shelterId,
  });

  const { data: roomData } = useQuery<GetRoomQuery, GetRoomQueryVariables>(
    GetRoomDocument,
    {
      variables: { id: roomId ?? '' },
      skip: !roomId,
    }
  );

  const { data: bedData } = useQuery<GetBedQuery, GetBedQueryVariables>(
    GetBedDocument,
    {
      variables: { id: bedId ?? '' },
      skip: !bedId,
    }
  );

  const { data: reservationData } = useQuery<
    GetReservationQuery,
    GetReservationQueryVariables
  >(GetReservationDocument, {
    variables: { pk: reservationId ?? '' },
    skip: !reservationId,
  });

  // Build name lookup
  const nameMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (shelterData?.operatorShelter?.id && shelterData.operatorShelter.name) {
      map[`__shelterId__:${shelterData.operatorShelter.id}`] =
        shelterData.operatorShelter.name;
    }
    if (roomData?.room?.id && roomData.room.name) {
      map[`__roomId__:${roomData.room.id}`] = roomData.room.name;
    }
    if (bedData?.beds?.results?.[0]?.id) {
      const bed = bedData.beds.results[0];
      map[`__bedId__:${bed.id}`] = bed.name ?? bed.id;
    }
    if (reservationData?.reservation?.id) {
      const clients = reservationData.reservation.clients;
      const primary = clients.find((c) => c.isPrimary) ?? clients[0];
      const primaryName = primary.clientProfile
        ? formatClientDisplayName(primary.clientProfile)
        : '';
      const truncatedName =
        primaryName.length > 15
          ? primaryName.slice(0, 15) + '...'
          : primaryName;
      const suffix = clients.length > 1 ? ` +${clients.length - 1}` : '';
      map[`__reservationId__:${reservationData.reservation.id}`] =
        `${truncatedName}${suffix}` || 'Reservation';
    }

    return map;
  }, [shelterData, roomData, bedData, reservationData]);

  // Resolve items
  const items = useMemo(() => {
    return rawItems.map((item) => ({
      ...item,
      label: nameMap[item.label] ?? item.label,
    }));
  }, [rawItems, nameMap]);

  return { items };
}
