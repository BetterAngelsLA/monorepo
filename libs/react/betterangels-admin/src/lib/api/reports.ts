/**
 * The Reports page's REST surface, in one place.
 *
 * GraphQL reads go through the generated operation documents, so they are not here. These
 * three endpoints are different: a CSV download and two deck.gl tile *templates*, which the
 * fetch and tile layers build by hand. Keeping their paths and query-string spellings here
 * means the hook and the map layer agree about the endpoints they share, and a test can pin
 * the URL without rendering either.
 *
 * The paths are relative to the API host. Callers with a URL-baking `fetch` (the CSV download)
 * pass them straight through; callers that hand the URL to a third party (deck.gl) prefix
 * `apiUrl` first.
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

/**
 * The wire spelling of a dimension.
 *
 * `RegionDimension` is uppercase (`COUNCIL_DISTRICT`) and every REST endpoint matches the
 * lowercase `kind`. The map layer already holds the wire kind in some places, so both spellings
 * are accepted and normalized here; sending the enum as-is made every tile 404 and left the
 * boundary layer empty. The conversion lives here rather than at each call site so there is
 * one spelling.
 */
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
 * `GET /reports/export/` — the CSV download, scoped to the page's group.
 *
 * `codes` is repeated (`?codes=a&codes=b`), which is what the endpoint reads. An empty list is
 * omitted rather than sent as `codes=`: absent means "every region of the dimension", while an
 * explicitly empty list means "no region" and would download an empty file.
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

/**
 * `GET /regions/tiles/<kind>/{z}/{x}/{y}.mvt` — the boundary layer for one grouping.
 *
 * Absolute, because deck.gl's `TileLayer` fetches the template directly and a relative
 * template would resolve against the page origin rather than the API's.
 */
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
 * `GET /regions/tiles/density/{z}/{x}/{y}.mvt?...` — the interaction density grid.
 *
 * The query string carries the org and the window, and the region pair only when the reader
 * narrowed to specific regions: a grouping with nothing selected must not change the URL, or
 * every group-by would refetch identical tiles. Codes are sorted because deck.gl caches tiles
 * by URL — the same set chosen in a different order is not a second URL.
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
