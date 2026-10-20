/**
 * The Reports REST endpoints — CSV export and the two deck.gl tile templates. GraphQL reads use
 * the generated documents. Paths are relative; tile callers prepend `apiUrl`.
 */

import type { RegionDimension } from '@monorepo/ba-platform/types';

/** The geographic scope the Reports page is showing. */
export type ReportGroup = {
  dimension?: RegionDimension;
  codes?: string[];
};

const REPORTS_EXPORT_PATH = '/reports/export/';
const REGION_TILES_PATH = '/regions/tiles';
const DENSITY_TILES_PATH = '/regions/tiles/density';
const TILE_SUFFIX = '/{z}/{x}/{y}.mvt';

/** Lowercase wire `kind`: the enum is uppercase and every endpoint matches `city`, not `CITY`. */
function wireKind(dimension: string): string {
  return dimension.toLowerCase();
}

export type InteractionExportParams = {
  /** Inclusive calendar days, as `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  organizationId?: string;
  group?: ReportGroup;
};

/**
 * `GET /reports/export/`. `codes` is repeated; an empty list is omitted because absent means
 * "every region" and `codes=` means "no region".
 */
export function interactionExportUrl({
  startDate,
  endDate,
  organizationId,
  group,
}: InteractionExportParams): string {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  if (organizationId) {
    params.set('org_id', organizationId);
  }
  if (group?.dimension) {
    params.set('dimension', wireKind(group.dimension));
  }
  for (const code of group?.codes ?? []) {
    params.append('codes', code);
  }
  return `${REPORTS_EXPORT_PATH}?${params.toString()}`;
}

/** `GET /regions/tiles/<kind>/{z}/{x}/{y}.mvt`. Absolute: deck.gl fetches the template itself. */
export function regionTileUrl(apiUrl: string, dimension: string): string {
  return `${apiUrl}${REGION_TILES_PATH}/${wireKind(dimension)}${TILE_SUFFIX}`;
}

export type DensityTileParams = {
  apiUrl: string;
  organizationId: string;
  /** Inclusive calendar days, as `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  /** Set only when the reader drilled into specific regions. Either spelling of the kind. */
  dimension?: string;
  codes?: string[];
};

/**
 * `GET /regions/tiles/density/{z}/{x}/{y}.mvt`. The region pair is sent only for a drill-down,
 * and codes are sorted because deck.gl caches tiles by URL.
 */
export function densityTileUrl({
  apiUrl,
  organizationId,
  startDate,
  endDate,
  dimension,
  codes = [],
}: DensityTileParams): string {
  const params = new URLSearchParams({
    org_id: organizationId,
    start: startDate,
    end: endDate,
  });
  if (dimension && codes.length > 0) {
    params.set('dimension', wireKind(dimension));
    for (const code of [...codes].sort()) {
      params.append('codes', code);
    }
  }
  return `${apiUrl}${DENSITY_TILES_PATH}${TILE_SUFFIX}?${params.toString()}`;
}
