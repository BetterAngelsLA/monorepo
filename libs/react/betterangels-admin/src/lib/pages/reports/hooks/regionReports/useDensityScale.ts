import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import {
  DensityScaleDocument,
  type DensityScaleQuery,
  type DensityScaleQueryVariables,
} from './__generated__/regions.generated';

type UseDensityScaleArgs = {
  organizationId: string;
  startDate: string;
  endDate: string;
  /** The tile zoom the map is drawing; the server's grid changes with it. */
  zoom: number;
  /** Only meaningful with `regionCodes`; omitted when the heatmap is county-wide. */
  dimension?: RegionDimension;
  regionCodes?: string[];
  /** False outside the heatmap view, which is the only view that reads the scale. */
  enabled?: boolean;
};

/**
 * The per-zoom colour domain for the density tiles.
 *
 * Quantiles of the same non-empty cells the tile paints. The map uses `p95` as its red end so
 * 95% of cells span the ramp and the top 5% clamp; the server computes it over the whole
 * filtered window, so panning does not change the colours. It is **relative to the zoom**
 * because the cell size changes; the legend says so.
 *
 * A scale for the previous zoom is not reused while the next one loads: a cached answer is
 * instant, and a stale domain would colour new cells against the old bin size.
 */
export function useDensityScale({
  organizationId,
  startDate,
  endDate,
  zoom,
  dimension,
  regionCodes,
  enabled = true,
}: UseDensityScaleArgs) {
  const { data, loading } = useQuery<
    DensityScaleQuery,
    DensityScaleQueryVariables
  >(DensityScaleDocument, {
    variables: {
      organizationId,
      startDate,
      endDate,
      dimension,
      regionCodes,
      zoom,
    },
    skip: !organizationId || !enabled,
  });

  // Ignore the answer while it is for different variables. Apollo keeps the last result
  // mounted across a variables change; the map falls back to its default domain for that
  // tick rather than colouring the new grid with the old one.
  const scale = !loading ? (data?.densityScale ?? null) : null;

  return { scale, loading };
}
