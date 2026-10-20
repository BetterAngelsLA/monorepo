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
 * The page's geographic group: optional dimension, optional regions. This is a scope — the
 * KPIs, charts, map and table all read it — so it sits at the top of the page, and the page owns
 * the state.
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

  // Options come from the unfiltered rollup so selecting one region does not remove the
  // others; filtered by `kind` because the previous dimension's rows linger while it loads.
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
            // Busy state while the dimensions are in flight.
            loading={dimensionsLoading}
            value={dimension}
            // The page clears the codes in the same batch; they are dimension-specific.
            onChange={onDimensionChange}
            style={{ minWidth: 220 }}
            placeholder="All dimensions"
            options={dimensionOptions}
            // Not searchable: `showSearch` makes the input editable for password managers, and
            // six fixed options do not need it.
          />
        )}
      </div>

      {dimension !== undefined && (
        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:max-w-xl">
          <Text type="secondary">Show</Text>
          {/* Searchable multi-select; the pills are what show the selection after it closes. */}
          <Select<string[], RegionOption>
            aria-label="Show regions"
            mode="multiple"
            showSearch
            allowClear
            // Rows can be stale while a dimension change loads.
            loading={rowsLoading}
            options={regionOptions}
            value={selectedCodes}
            onChange={onSelectedCodesChange}
            // Cap the pills; antd's `responsive` mode renders a stray "+0" chip.
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
