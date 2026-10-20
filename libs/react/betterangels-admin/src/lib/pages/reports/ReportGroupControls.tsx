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

  // Options come from the unfiltered rollup: one region must not remove the others from the
  // list. The rows are already scoped to the requested dimension (the API leaves `kind` empty
  // in that case), so filtering by kind here would drop every option.
  const selectable = useMemo(
    () => regionBreakdownView(rows, []).selectable,
    [rows],
  );

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

  let dimensionPlural = 'regions';
  if (dimension !== undefined) {
    dimensionPlural = kindLabelPlural(dimension, dimensions);
  }

  // Loading and "the server reports no loaded boundary sets" both arrive as an empty list, so
  // they are told apart rather than showing an empty dropdown with no explanation.
  const noBoundaries =
    !dimensionsLoading &&
    dimensionsError === undefined &&
    dimensions.length === 0;

  let groupPlaceholder = 'All dimensions';
  if (dimensionsError) {
    groupPlaceholder = 'Groupings unavailable';
  } else if (noBoundaries) {
    groupPlaceholder = 'No groupings loaded';
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
      <div
        className="flex min-w-[220px] flex-col gap-1"
        title={
          dimensionsError
            ? 'Could not load groupings'
            : noBoundaries
              ? 'No region boundaries have been loaded for this organisation'
              : undefined
        }
      >
        <Text type="secondary">Group by</Text>
        <Select<RegionDimension | undefined, DimensionOption>
          aria-label="Group by"
          // Clears to "All dimensions" — the summary then spans the whole organisation.
          allowClear
          loading={dimensionsLoading}
          disabled={dimensionsError !== undefined || noBoundaries}
          value={dimension}
          // The page clears the codes in the same batch; they are dimension-specific.
          onChange={onDimensionChange}
          placeholder={groupPlaceholder}
          options={dimensionOptions}
          // Not searchable: `showSearch` makes the input editable for password managers, and
          // six fixed options do not need it.
        />
      </div>

      <div className="flex min-w-[240px] flex-1 flex-col gap-1 lg:max-w-md">
        <Text type="secondary">Show</Text>
        {/* Searchable multi-select; the pills show the selection after it closes. */}
        <Select<string[], RegionOption>
          aria-label="Show regions"
          mode="multiple"
          showSearch
          allowClear
          // Rows can be stale while a dimension change loads.
          loading={rowsLoading}
          // Disabled rather than hidden: the dependent control keeps its place, so choosing a
          // grouping does not reflow the toolbar.
          disabled={dimension === undefined}
          options={regionOptions}
          value={selectedCodes}
          onChange={onSelectedCodesChange}
          // Cap the pills; antd's `responsive` mode renders a stray "+0" chip.
          maxTagCount={2}
          placeholder={
            dimension === undefined
              ? 'Choose a grouping'
              : `All ${dimensionPlural}`
          }
          style={{ width: '100%' }}
          // Searches the name *and* the code, because a reader usually has the code in hand
          // ("district 13") and it is not what the label starts with.
          filterOption={(input, option) =>
            matches(option?.searchText ?? '', input)
          }
        />
      </div>
    </div>
  );
}
