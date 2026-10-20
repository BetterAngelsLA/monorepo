import { Select, Typography } from 'antd';
import { useMemo } from 'react';
import { RegionDimension } from '@monorepo/ba-platform/types';
import type { RegionCountType, RegionDimensionInfoType } from './hooks';
import {
  displayName,
  kindLabelPlural,
  matches,
  regionBreakdownView,
} from './regionBreakdown';

const { Text } = Typography;

/** An option in the "Group by" select. */
type DimensionOption = { value: RegionDimension; label: string };

/** An option in the region multi-select; `searchText` is what its `filterOption` reads. */
type RegionOption = { value: string; label: string; searchText: string };

type ReportGroupControlsProps = {
  /** The published dimension vocabulary; empty until `regionDimensions` answers. */
  dimensions: RegionDimensionInfoType[];
  dimensionsLoading: boolean;
  dimensionsError?: Error;
  /** The group the whole page is scoped to. `undefined` is "All dimensions". */
  dimension?: RegionDimension;
  /** Specific regions within `dimension`; empty means every region of it. */
  selectedCodes: string[];
  /** The unfiltered rollup for `dimension`, which supplies the region options. */
  rows: RegionCountType[];
  /** The rollup is in flight, so the region list is not final yet. */
  rowsLoading: boolean;
  onDimensionChange: (dimension?: RegionDimension) => void;
  onSelectedCodesChange: (codes: string[]) => void;
};

/**
 * The page's geographic group: an optional dimension, and optionally some of its regions.
 *
 * Sits at the top of the Reports page because it is a **scope**, not a display option: every
 * KPI and every chart below it is calculated over the same group, and so are the map and the
 * table at the bottom. It used to live inside the location card, where changing it visibly
 * re-partitioned the table while leaving the charts above untouched — the numbers disagreed
 * with the page they were on.
 *
 * The state belongs to the page rather than this component: the summary query, the rollup and
 * the map all have to read the same selection, and a control that owned it would be the only
 * thing that knew what the charts were showing.
 */
export function ReportGroupControls({
  dimensions,
  dimensionsLoading,
  dimensionsError,
  dimension,
  selectedCodes,
  rows,
  rowsLoading,
  onDimensionChange,
  onSelectedCodesChange,
}: ReportGroupControlsProps) {
  const dimensionOptions: DimensionOption[] = useMemo(
    () => dimensions.map((info) => ({ value: info.value, label: info.label })),
    [dimensions],
  );

  // The picker's set is the *unfiltered* rollup, for the same reason the multi-select could
  // never work from a filtered one: choosing one region would remove the others from the list
  // and the reader could never select a second.
  //
  // Filtered to the current dimension by `kind`, because the rollup keeps the previous rows
  // while a new dimension loads — one dimension's codes are not another's, and offering a
  // council district while the reader is looking at cities would let them pick a region the
  // page is not asking about.
  const selectable = useMemo(() => {
    const rowsForDimension = regionBreakdownView(rows, []).selectable;
    if (dimension === undefined) {
      return rowsForDimension;
    }
    return rowsForDimension.filter(
      (row) => row.kind.toLowerCase() === dimension.toLowerCase(),
    );
  }, [rows, dimension]);

  // A code is what a reader usually has to hand ("district 13") and it is not what the label
  // starts with, so the option carries the searchable text explicitly.
  const regionOptions: RegionOption[] = useMemo(
    () =>
      selectable.map((row) => ({
        value: row.code,
        label: `${displayName(row)} (${row.count.toLocaleString()})`,
        searchText: `${row.name} ${row.code}`,
      })),
    [selectable],
  );

  let dimensionPlural = 'dimensions';
  if (dimension !== undefined) {
    dimensionPlural = kindLabelPlural(dimension, dimensions);
  }

  let selectionHint = `No selection means every ${dimensionPlural.toLowerCase()} in range.`;
  if (selectedCodes.length > 0) {
    // No denominator: the options are the *current* range's regions, so a selection made in
    // an earlier range can exceed it and read "3 of 1 selected".
    selectionHint = `${selectedCodes.length} selected — clear the control to show all.`;
  }

  // Loading and "the server reports no loaded boundary sets" both arrive as an empty list, so
  // they are told apart rather than showing an empty dropdown with no explanation.
  const noBoundaries =
    !dimensionsLoading &&
    dimensionsError === undefined &&
    dimensions.length === 0;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex shrink-0 flex-col gap-1">
        <Text type="secondary">Group by</Text>
        {dimensionsError ? (
          // Static copy, not the backend body: an error message is not a user-facing label.
          <Text type="danger">Could not load groupings.</Text>
        ) : noBoundaries ? (
          <Text type="secondary">
            No region boundaries have been loaded for this organisation.
          </Text>
        ) : (
          <Select<RegionDimension | undefined, DimensionOption>
            // The caption above is a `<Text>`, not a `<label>`, so the combobox needs its name
            // here; rc-select forwards `aria-*` to the input.
            aria-label="Group by"
            // Clears to "All dimensions" — the summary then spans the whole organisation.
            allowClear
            // Without this the page's primary control is an empty dropdown with a placeholder
            // and no busy state while the dimensions are in flight.
            loading={dimensionsLoading}
            value={dimension}
            // The codes are cleared by the page **in the same batch** as the dimension,
            // because they are only meaningful within it ("4" is an SPA and also a Long Beach
            // council district). A stale pair would fetch a region the reader never picked.
            onChange={onDimensionChange}
            style={{ minWidth: 220 }}
            placeholder="All dimensions"
            options={dimensionOptions}
            // **Not searchable, deliberately.** Six fixed options do not need a search box,
            // and `showSearch` is the only thing that makes antd's Select input editable:
            // without it rc-select renders it `readOnly`, and an editable field is what makes
            // a password manager offer to fill or save it. The multi-select below still needs
            // search and keeps it.
          />
        )}
      </div>

      {dimension !== undefined && (
        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:max-w-xl">
          <Text type="secondary">Show</Text>
          {/* A searchable multi-select with the selection kept visible as removable pills.
              The dropdown closes on select in multiple mode, which is why the pills — not the
              open list — are what tells the reader what is selected. */}
          <Select<string[], RegionOption>
            aria-label="Show regions"
            mode="multiple"
            showSearch
            allowClear
            // The rollup keeps the previous rows while a dimension change loads, so the list
            // is briefly stale; the busy state says so rather than making the reader think the
            // new dimension has no regions.
            loading={rowsLoading}
            options={regionOptions}
            value={selectedCodes}
            onChange={onSelectedCodesChange}
            // Keeps the pills from growing without bound; the overflow is the "+N" chip.
            // A fixed cap rather than `responsive`: antd's responsive mode renders the
            // overflow chip even when nothing is hidden, so three selected regions showed a
            // stray "+ 0 ..." beside them. Capping at two is also more honest — a "+N" that
            // always means N things you cannot see.
            maxTagCount={2}
            placeholder={`All ${dimensionPlural}`}
            style={{ width: '100%' }}
            // Searches the name *and* the code, because a reader usually has the code in hand
            // ("district 13") and it is not what the label starts with.
            filterOption={(input, option) =>
              matches(option?.searchText ?? '', input)
            }
          />
          <div className="text-xs text-neutral-500">{selectionHint}</div>
        </div>
      )}
    </div>
  );
}
