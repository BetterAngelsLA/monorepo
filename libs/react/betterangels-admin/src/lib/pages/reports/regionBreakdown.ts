/**
 * The location breakdown's pure logic: the dimension vocabulary, the code ordering and the
 * reader's selection applied to the one rollup.
 *
 * Separated from `LocationBreakdown` so it can be tested without a renderer. This is where the
 * two spellings of a dimension meet — the wire `kind` is lowercase (`council_district`) and
 * `RegionDimension` is uppercase (`COUNCIL_DISTRICT`) — and a lookup keyed by the wrong one does
 * not throw, it silently falls through to the fallback for every row. That is a bug only a test
 * on this module can catch.
 */

import { UnassignedReason } from '@monorepo/ba-platform/types';
import type { RegionCountType } from './hooks';

/**
 * Display names for the dimensions, keyed by the **wire** value (`council_district`).
 *
 * One map, not two: the table and the dropdown share it, so a rename cannot make them
 * disagree. `Partial` because a bucket's `kind` arrives off the wire as a plain string and may
 * be a value this build has never heard of — the map is a lookup that can miss, not a record
 * that covers every string.
 */
const DIMENSION_LABELS: Partial<Record<string, string>> = {
  zip: 'ZIP Code',
  city: 'City',
  council_district: 'City Council District',
  supervisorial_district: 'Supervisorial District',
  spa: 'Service Planning Area',
  coc: 'Continuum of Care',
};

/**
 * Plural forms, for "All …" and any other place a count is implied.
 *
 * Written out rather than derived: `city` + "s" is not a word, and neither is `continuum of
 * care` + "s". Keyed by the wire value for the same reason the labels are.
 */
const DIMENSION_PLURALS: Partial<Record<string, string>> = {
  zip: 'ZIP Codes',
  city: 'Cities',
  council_district: 'City Council Districts',
  supervisorial_district: 'Supervisorial Districts',
  spa: 'Service Planning Areas',
  coc: 'Continuums of Care',
};

/**
 * Clients with no address on file, versus clients outside every boundary we load.
 * These mean different things to a program manager — the first is a data-entry gap
 * we can act on, the second is a coverage gap — so they are labelled separately
 * rather than collapsed into one "Unassigned" slice.
 */
const UNASSIGNED_LABELS: Partial<Record<UnassignedReason, string>> = {
  [UnassignedReason.NoLocation]: 'No location on file',
  [UnassignedReason.OutsideAllRegions]: 'Outside all boundaries',
};

/**
 * Prose label for a dimension. Accepts either spelling.
 *
 * The wire `kind` is lowercase and `RegionDimension` spells the same dimension uppercase, so
 * both have to resolve. Unknown keys fall back to the raw value, so a dimension this build has
 * never heard of still renders.
 */
export function kindLabel(kind: string): string {
  return DIMENSION_LABELS[kind] ?? DIMENSION_LABELS[kind.toLowerCase()] ?? kind;
}

/** The plural of `kindLabel`, for controls that offer more than one of them. */
export function kindLabelPlural(kind: string): string {
  return (
    DIMENSION_PLURALS[kind] ??
    DIMENSION_PLURALS[kind.toLowerCase()] ??
    `${kindLabel(kind)}s`
  );
}

/**
 * Case-insensitive substring match on the option's searchable text.
 *
 * Matching the code as well as the name is the point: a reader looking for council
 * district 13 types "13", not "Adrin Nazarian".
 */
export function matches(text: string, input: string): boolean {
  return text.toLowerCase().includes(input.trim().toLowerCase());
}

/**
 * Sorted for reading, not for the API.
 *
 * Codes arrive in whatever order the database returns them, which for numeric codes is
 * dictionary order — "1", "10", "11", "2" — and reads as unsorted. Numeric codes are therefore
 * compared as numbers and everything else alphabetically, so ZIP codes and cities stay in a
 * sensible order too.
 */
export function compareRegionCodes(a: string, b: string): number {
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isNaN(an) && !Number.isNaN(bn)) {
    return an - bn;
  }
  return a.localeCompare(b);
}

/** The reader-facing label for an unassigned bucket, falling back to a plain "Unassigned". */
export function unassignedLabel(row: RegionCountType): string {
  if (!row.unassignedReason) {
    return 'Unassigned';
  }
  return UNASSIGNED_LABELS[row.unassignedReason] ?? 'Unassigned';
}

/**
 * The label for an unassigned row in the panel under the map.
 *
 * Ungrouped, the same reason repeats once per dimension — one "Outside all boundaries" per
 * dimension — so the kind is what tells the rows apart: 23 and 291 are different populations,
 * not duplicates of each other. Grouped, every row shares the one dimension, so naming it again
 * would be noise.
 */
export function unassignedRowLabel(
  row: RegionCountType,
  dimension?: string,
): string {
  const label = unassignedLabel(row);
  if (dimension === undefined && row.kind) {
    return `${label} (${kindLabel(row.kind)})`;
  }
  return label;
}

/**
 * The region's display label.
 *
 * `||` and not `??`: an empty name is not a label, so the code stands in for it. One
 * implementation because three places need the same rule — the table's name column, the
 * drill-down option's text, and the "within …" prose — and a region with no name must read as
 * its code in all three.
 */
export function displayName(row: Pick<RegionCountType, 'name' | 'code'>): string {
  return row.name || row.code;
}

export type RegionBreakdownView = {
  /** Named regions with interactions — what the table and the drill-down are drawn from. */
  assigned: RegionCountType[];
  /** Every named region with interactions in the dimension, unfiltered: the picker's set. */
  pickable: RegionCountType[];
  /** `pickable`, sorted for reading: numeric codes as numbers, everything else alphabetically. */
  selectable: RegionCountType[];
  /** The unassigned buckets in the selection. */
  unassigned: RegionCountType[];
  hasData: boolean;
  /** Names of the selected regions, for prose. `undefined` when nothing is selected. */
  filteredToName?: string;
};

/**
 * The reader's selection applied to the one rollup.
 *
 * The picker still needs the *unfiltered* set — a multi-select built from the filtered result
 * collapses to the one region chosen and can never select a second. So `pickable` is the whole
 * rollup and the narrowed rows are an intermediate here rather than a field the caller reads.
 *
 * **The table's order is the count order**, which the "Interactions" column implements with
 * `defaultSortOrder: 'descend'`. There is deliberately no cross-dimension order to impose: the
 * table only renders when a single dimension is chosen (the ungrouped view asks the reader to
 * choose one instead, because the six dimensions partition the same interactions and their rows
 * cannot be added together).
 */
export function regionBreakdownView(
  rows: RegionCountType[],
  selectedCodes: string[],
): RegionBreakdownView {
  let shown = rows;
  if (selectedCodes.length > 0) {
    // Two predicates, both mirroring `region_rollup` so the local view cannot drift from what
    // the API would have returned for the same codes:
    //
    // 1. keep only the named buckets asked for (the `region__code__in` arm);
    // 2. **drop the unassigned buckets.** They are not regions and have no code, so they cannot
    //    match a selection — and the backend drops them too, because `keep_unassigned` is false
    //    whenever codes are given. Filtering on `code` alone would keep them, which reads as
    //    "outside all boundaries: 291" beside a drill-down into two districts.
    shown = rows.filter(
      (row) => !row.isUnassigned && selectedCodes.includes(row.code),
    );
  }

  const pickable = rows.filter((row) => !row.isUnassigned && row.count > 0);
  const selectable = [...pickable].sort((a, b) =>
    compareRegionCodes(a.code, b.code),
  );
  const assigned = shown.filter((row) => !row.isUnassigned && row.count > 0);
  const unassigned = shown.filter((row) => row.isUnassigned);

  // Resolved here rather than inline in the JSX. A selected code that is not in `assigned` has
  // no row to name it, so the code itself is all there is to print.
  let filteredToName: string | undefined;
  if (selectedCodes.length > 0) {
    filteredToName = selectedCodes
      .map((code) => {
        const match = assigned.find((row) => row.code === code);
        if (match === undefined) {
          return code;
        }
        return displayName(match);
      })
      .join(', ');
  }

  // Deliberately ignores loading: a refetch must not unmount the map.
  //
  // And deliberately the **unfiltered** rollup, not `assigned`. A drill-down outlives the data
  // it was chosen from: change the date range with a region selected and the rollup refetches
  // unfiltered, so a region with interactions in the old window can have none in the new one.
  // Reading `assigned` here called that an empty range — the panel said there were no located
  // interactions when there were, elsewhere — and unmounted `RegionMap` for the duration.
  return {
    assigned,
    pickable,
    selectable,
    unassigned,
    hasData: pickable.length > 0,
    filteredToName,
  };
}
