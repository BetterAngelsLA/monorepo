import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import {
  InteractionsByRegionDocument,
  type InteractionsByRegionQuery,
  type InteractionsByRegionQueryVariables,
} from './__generated__/regions.generated';

/**
 * The generated operations export their whole `Query` type rather than per-field
 * types (the config only generates operations here; base types live in
 * `@monorepo/ba-platform/types`), so the row type is derived from it.
 */
export type RegionCountType =
  InteractionsByRegionQuery['interactionsByRegion'][number];

type UseInteractionsByRegionArgs = {
  organizationId: string;
  /** Absent means every dimension at once; buckets then carry their own `kind`. */
  dimension?: RegionDimension;
  startDate: string;
  endDate: string;
  /** Narrow the rollup to these regions, matching the map's drill-down. */
  regionCodes?: string[];
};

/**
 * Interactions grouped by geography. The API returns the unassigned buckets as
 * rows with `isUnassigned` set rather than omitting them, so that a client
 * outside every boundary is visible instead of silently dropped.
 *
 * **The previous rows are kept while a new grouping loads.** Changing `dimension` makes this
 * a different query as far as the cache is concerned, so `data` is `undefined` for the whole
 * round trip and every consumer sees an empty rollup. Empty is not "no data" here, it is "not
 * yet", and the two are indistinguishable downstream: the panel reads it as no located
 * interactions, unmounts the map, and collapses to a spinner. The page then shrinks by a
 * panel's height, the browser clamps the reader's scroll position to fit the shorter
 * document, and the page jumps. `previousData` is the client's own answer to exactly this —
 * it holds the last result across a variables change — so the layout stays put and the
 * numbers inside it update when the response lands.
 *
 * `loading` still reports the truth, so a caller that wants a busy state can have one.
 */
export function useInteractionsByRegion({
  organizationId,
  dimension,
  startDate,
  endDate,
  regionCodes,
}: UseInteractionsByRegionArgs) {
  const { data, previousData, loading, error } = useQuery<
    InteractionsByRegionQuery,
    InteractionsByRegionQueryVariables
  >(InteractionsByRegionDocument, {
    variables: { organizationId, dimension, startDate, endDate, regionCodes },
    skip: !organizationId,
  });

  const activeData = data ?? previousData;

  return {
    rows: activeData?.interactionsByRegion ?? [],
    loading,
    error,
  };
}
