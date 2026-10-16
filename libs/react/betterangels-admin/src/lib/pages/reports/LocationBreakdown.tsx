import {
  Alert,
  Radio,
  Select,
  Spin,
  Table,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RegionDimension } from '@monorepo/ba-platform/types';
import { useVisibilityObserver } from '@monorepo/react/shared';
import { ChartCard } from '../../components';
import {
  useInteractionMap,
  useInteractionsByRegion,
  useRegionDimensions,
  type RegionCountType,
} from './hooks';
import {
  kindLabel,
  kindLabelPlural,
  matches,
  regionBreakdownView,
  unassignedRowLabel,
} from './regionBreakdown';
import { GENERIC_ERROR_MESSAGE, isRefusalError } from './reportErrors';
import { RegionMap, type MapView } from './RegionMap';

const { Text } = Typography;

/** An option in the "Group by" select. */
type DimensionOption = { value: RegionDimension; label: string };

/** An option in the region multi-select; `searchText` is what its `filterOption` reads. */
type RegionOption = { value: string; label: string; searchText: string };

type LocationBreakdownProps = {
  organizationId: string;
  startDate: string;
  endDate: string;
  hasMapsKey?: boolean;
  className?: string;
};

/** antd's data-format spec: show `-` when there is no value. */
function renderCode(code: string) {
  if (!code) {
    return <Text type="secondary">-</Text>;
  }
  return code;
}

/**
 * The region's display name.
 *
 * `||` and not `??`: an empty name is not a label, so the code stands in for it. Every row here
 * is a named region — the unassigned buckets are listed below the table instead.
 */
function renderName(name: string, row: RegionCountType) {
  return name || row.code;
}

/**
 * Interactions grouped by geography.
 *
 * The API returns the unassigned buckets as rows with `isUnassigned` set rather than omitting
 * them, so that a client outside every boundary is visible instead of silently dropped. They are
 * not regions and have no code to drill into, so the table carries the named regions and the
 * unassigned figures sit beneath it in their own panel. Printing them in both places gave the
 * reader the same number twice with no way to tell that it was one figure.
 */
export function LocationBreakdown({
  organizationId,
  startDate,
  endDate,
  hasMapsKey = true,
  className = '',
}: LocationBreakdownProps) {
  // `undefined` is "All dimensions", and it is the default: the page opens on the whole
  // picture rather than on one arbitrary grouping. Codes are meaningless across dimensions, so
  // the drill-down stays disabled until one is chosen.
  const [dimension, setDimension] = useState<RegionDimension | undefined>(
    undefined,
  );

  // Regions to narrow the map to — "show me the SPA 4 visits". Empty means the whole
  // dimension.
  // A list rather than one code: comparing two districts side by side is the common
  // question ("where are we strong in 8 versus 9?"), and the plumbing is already a list
  // the whole way down to the API, so single-select was an artificial restriction.
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  // Owned here so the toggle can sit in the card header, beside the title, rather than
  // inside the map among the filters.
  const [mapView, setMapView] = useState<MapView>('heatmap');

  const {
    dimensions,
    loading: dimensionsLoading,
    error: dimensionsError,
  } = useRegionDimensions();

  /**
   * **One rollup, unfiltered.** The drill-down is applied locally by `regionBreakdownView`.
   *
   * Two calls over the same dimension would be redundant: `region_rollup` with codes returns
   * exactly the subset of the unfiltered buckets whose code was asked for (`keep_unassigned` is
   * false when codes are given, so nothing extra is added), so the same rows are already in
   * hand. The picker needs the *unfiltered* set for the opposite reason — a multi-select built
   * from the filtered result collapses to the one region chosen and can never select a second.
   * One unfiltered rollup satisfies both: `pickable` is it, and the drill-down's narrowed rows
   * are derived from it rather than fetched again.
   */
  const {
    rows: availableRegions,
    loading: rowsLoading,
    error,
  } = useInteractionsByRegion({
    organizationId,
    dimension,
    startDate,
    endDate,
  });
  // The heatmap is deliberately **not** scoped by the grouping. A group-by re-partitions
  // the same interactions; it does not select a different set of them, so letting it
  // change the surface implies the underlying data moved when nothing did. It would also
  // defeat the view: picking a dimension would narrow the map from 431 regions to a
  // dozen and throw away the county-wide picture the heatmap exists to show.
  //
  // The grouping drives the boundaries drawn *over* the surface instead, which is the
  // usual separation: the gradient encodes a continuous quantity, the boundaries encode a
  // categorical one.

  // The map panel is below the fold and its point payload is the largest thing this page
  // fetches, so the request waits until the reader is near it.
  //
  // The observed node is a wrapper that is rendered whether or not the map is: the map
  // itself only appears once there is something to draw, so observing *it* would never fire
  // and the points would never arrive. `rootMargin` starts the request a little early, so
  // arriving at the map does not then mean waiting on the network.
  const [mapVisible, setMapVisible] = useState(false);
  const showMap = useCallback(() => setMapVisible(true), []);
  const { triggerRef } = useVisibilityObserver({
    onTrigger: showMap,
    // The latch is the state, so there is nothing left to observe once it has fired.
    enabled: !mapVisible,
    rootMargin: '400px',
  });

  const {
    points,
    truncated,
    loading: pointsLoading,
    error: mapError,
  } = useInteractionMap({
    organizationId,
    startDate,
    endDate,
    // The density grid ignores the *grouping* — a group-by re-partitions the same
    // interactions rather than selecting different ones, so it must not move the surface. It
    // does honour the *drill-down*, because narrowing to SPA 4 and still seeing the whole
    // county is the bug this fixes: no interaction should sit outside the shapes drawn.
    //
    // `dimension` travels with the drill-down only, for the same reason: a code cannot be
    // resolved without one, and the API rejects codes that arrive without it rather than
    // guessing. Sending it when nothing is selected would contradict the paragraph above —
    // it changes the query's variables without changing its answer.
    dimension: selectedCodes.length > 0 ? dimension : undefined,
    regionCodes: selectedCodes.length > 0 ? selectedCodes : undefined,
    // **Not while the density grid is showing.** The grid is aggregated on the server from
    // the same notes, so the point list is not an input to anything the reader is looking at,
    // and requesting it spends ~1 MB to derive clusters nobody asked for. Whether the reader
    // may see the interactions at all is answered by the density tile, and `RegionMap` surfaces
    // that refusal in place.
    enabled: mapVisible && mapView === 'clusters',
  });

  /**
   * The reader's selection applied to the one rollup. Pure, and tested in `regionBreakdown`.
   *
   * The layout is stable without a "hold the last good rows" state machine: changing the
   * selection does not trigger a fetch, and `availableRegions` keeps its previous value while a
   * real refetch is in flight.
   */
  const breakdown = useMemo(
    () => regionBreakdownView(availableRegions, selectedCodes),
    [availableRegions, selectedCodes],
  );
  const { assigned, pickable, selectable, unassigned, hasData } = breakdown;

  // Used for prose only ("Loading city council district data"). Absent means the rollup
  // spans every dimension, so there is no single name to interpolate.
  let dimensionName = 'all dimensions';
  if (dimension) {
    dimensionName = kindLabel(dimension);
  }
  let dimensionNamePlural = 'dimensions';
  if (dimension) {
    dimensionNamePlural = kindLabelPlural(dimension);
  }

  // Selecting a different dimension invalidates the codes: "4" is an SPA and also a Long
  // Beach council district, so a selection cannot carry across.
  //
  // Returning the existing array when it is already empty matters: a fresh `[]` is not
  // `Object.is`-equal to the old one, so it would schedule a render on mount for no change.
  useEffect(() => {
    setSelectedCodes((codes) => (codes.length === 0 ? codes : []));
  }, [dimension]);

  /**
   * **Two error states, not one.** The rollup and the map are separate queries with separate
   * authorities, so one failing must not take the other down.
   *
   * `interactionMap` is a second request over the same data: it can fail on its own — a 500, a
   * dropped connection, a validation error — while the rollup beside it succeeds. Folding it
   * into the panel-wide `queryError` replaced the whole card — rollup, table, figures — with
   * "Something went wrong", hiding data the reader was entitled to. The map degrades in place
   * instead, the way a missing Maps key already does.
   *
   * A **refusal** is the one failure that is not a fault, and it gets its own copy; see
   * `reportErrors`. The tile path applies the same rule, so the two halves of one refusal agree.
   *
   * `dimensionsError` *is* panel-wide: without the dimension list there is no grouping to
   * choose, which is the panel's reason to exist.
   */
  const panelError = dimensionsError ?? error;
  const mapRefused = mapError !== undefined && isRefusalError(mapError);
  const mapFailed = mapError !== undefined && !mapRefused;

  // Backend error bodies are not user-facing copy: log the real error and show a
  // generic message instead.
  useEffect(() => {
    if (panelError) {
      console.error(panelError);
    }
  }, [panelError]);

  useEffect(() => {
    if (mapError) {
      console.error(mapError);
    }
  }, [mapError]);

  // Both option arrays are typed, so `filterOption` reads a declared field rather than casting
  // one at the call site.
  const dimensionOptions: DimensionOption[] = useMemo(
    () => dimensions.map((value) => ({ value, label: kindLabel(value) })),
    [dimensions],
  );
  // A code is what a reader usually has to hand ("district 13") and it is not what the label
  // starts with, so the region options carry the searchable text explicitly.
  const regionOptions: RegionOption[] = useMemo(
    () =>
      selectable.map((row) => ({
        value: row.code,
        label: `${row.name || row.code} (${row.count.toLocaleString()})`,
        searchText: `${row.name} ${row.code}`,
      })),
    [selectable],
  );

  let selectionHint: string;
  if (selectedCodes.length === 0) {
    selectionHint = `No selection means every ${dimensionName.toLowerCase()} in range.`;
  } else {
    selectionHint = `${selectedCodes.length} of ${pickable.length} selected — clear the control to show all.`;
  }

  let loadingLabel = 'Loading data...';
  if (dimension) {
    loadingLabel = `Loading ${dimensionName.toLowerCase()} data...`;
  }

  let unassignedTitle = 'Not attributed to a region';
  if (dimension !== undefined) {
    unassignedTitle = `Not attributed to a ${dimensionName.toLowerCase()}`;
  }

  const columns: TableColumnsType<RegionCountType> = [
    {
      title: dimensionName,
      dataIndex: 'name',
      key: 'name',
      render: renderName,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: renderCode,
    },
    {
      title: 'Interactions',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      // The table's order is the count order — the honest order for a list of regions, and the
      // only one this table needs: it renders a single dimension at a time, so there is no
      // cross-dimension grouping to impose on it.
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
    },
  ];

  if (panelError) {
    return (
      <ChartCard title="Interactions by Location" className={className}>
        <Alert
          type="error"
          showIcon
          message={GENERIC_ERROR_MESSAGE}
          description="We could not load the location breakdown."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Interactions by Location"
      className={className}
      // The view toggle changes *how* the map draws, not *what* it draws, so it sits in the
      // header beside the title rather than in the row of filters — those are two different
      // kinds of choice and stacking them implies they are one.
      extra={
        <Radio.Group
          value={mapView}
          onChange={(event) => setMapView(event.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: 'Heatmap', value: 'heatmap' },
            { label: 'Clusters', value: 'clusters' },
          ]}
        />
      }
    >
      {/* Both filters live in the map card, directly above the map and table they affect.
          Side by side once there is room, stacked below that: they are two halves of one
          question ("grouped how, showing which"), and a column of them wastes a wide screen
          while a row of them would crush the controls on a narrow one. */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex shrink-0 flex-col gap-1">
          <Text type="secondary">Group by</Text>
          {/* **Not searchable, deliberately.** Six fixed options do not need a search box, and
              `showSearch` is the only thing that makes antd's Select input *editable*: without
              it rc-select renders it `readOnly` (`SelectInput/Content/index.js`), and an
              editable field is what makes a password manager offer to fill or save it — antd
              sets `autocomplete="new-password"` on that input unconditionally, with no prop
              that reaches it. So leaving search off here removes the cause rather than patching
              the symptom. The multi-select below still needs search and keeps it. */}
          <Select<RegionDimension | undefined, DimensionOption>
            // Clears to "All" — the rollup then spans every dimension.
            allowClear
            // Without this the panel's primary control is an empty dropdown with a
            // placeholder and no busy state while the dimensions are in flight.
            loading={dimensionsLoading}
            value={dimension}
            onChange={(value) => {
              // The selection is cleared by the effect on `dimension`, which also covers a
              // change from anywhere else; clearing here as well was a second copy of the
              // same rule.
              setDimension(value);
            }}
            style={{ minWidth: 220 }}
            placeholder="All dimensions"
            options={dimensionOptions}
          />
        </div>

        {dimension !== undefined && (
          <div className="flex min-w-0 flex-1 flex-col gap-1 lg:max-w-xl">
            <Text type="secondary">Show</Text>
            {/* A searchable multi-select with the selection kept visible as removable pills.
              The dropdown closes on select in multiple mode, which is why the pills — not the
              open list — are what tells the reader what is selected. */}
            <Select<string[], RegionOption>
              mode="multiple"
              showSearch
              allowClear
              // The options come from the unfiltered rollup, so choosing one never removes
              // the others from the list.
              options={regionOptions}
              value={selectedCodes}
              onChange={setSelectedCodes}
              // Keeps the pills from growing without bound; the overflow is the "+N" chip.
              // A fixed cap rather than `responsive`: antd's responsive mode renders the
              // overflow chip even when nothing is hidden, so three selected regions showed a
              // stray "+ 0 ..." beside them. Capping at two is also more honest — a "+N" that
              // always means N things you cannot see.
              maxTagCount={2}
              placeholder={`All ${dimensionNamePlural}`}
              style={{ width: '100%' }}
              // Searches the name *and* the code, because a reader usually has the code in
              // hand ("district 13") and it is not what the label starts with.
              filterOption={(input, option) =>
                matches(option?.searchText ?? '', input)
              }
            />
            <div className="text-xs text-neutral-500">{selectionHint}</div>
          </div>
        )}
      </div>

      {rowsLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spin size="small" /> {loadingLabel}
        </div>
      )}

      {!rowsLoading && !hasData && (
        <p className="text-center text-neutral-500">
          No located interactions for this range.
        </p>
      )}

      <div ref={triggerRef}>
        {hasData && (
          <div className="mb-5">
            <RegionMap
              dimension={dimension}
              points={points}
              pointsLoading={pointsLoading}
              truncated={truncated}
              hasMapsKey={hasMapsKey}
              refused={mapRefused}
              failed={mapFailed}
              filteredTo={breakdown.filteredToName}
              focusCodes={selectedCodes}
              view={mapView}
              organizationId={organizationId}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        )}
      </div>

      {hasData && dimension === undefined && (
        /*
         * One item, because a *table* of every dimension cannot be read as a total.
         *
         * The six dimensions partition the same interactions, so their rows are six views of
         * one population rather than six groups of it. Summing them gave 6,588 against a true
         * total of 1,098 — six times over — and listing 133 rows invited exactly that
         * addition. The count of unassigned interactions is the same trap: 318 is six partial
         * counts (council district 291, city 23, and 1 each for the other four), not one
         * bucket.
         *
         * So this asks the reader to choose a dimension rather than showing them a number
         * that cannot be added up. The total lives in the KPI above, and the map is already
         * showing every located interaction.
         */
        <div className="mt-4 rounded border border-neutral-200 bg-white p-4">
          <Text strong>Choose a grouping for the regional breakdown</Text>
          <p className="mt-1 mb-0 text-sm text-neutral-600">
            Each dimension covers the same interactions a different way, so
            their rows can not be added together. Pick one to see its regions,
            or leave it as “All dimensions” for the map and totals above.
          </p>
        </div>
      )}

      {hasData && dimension !== undefined && (
        <>
          {/* The drill-down is empty while the range is not: distinct from "no located
              interactions for this range" above, which is about the range itself. */}
          {!rowsLoading && selectedCodes.length > 0 && assigned.length === 0 && (
            <p className="mt-4 text-center text-sm text-neutral-500">
              No interactions in the selected regions for this range.
            </p>
          )}
          <Table<RegionCountType>
            className="mt-4"
            size="small"
            // The named regions of this dimension; a code is unique within one. `kind` is in the
            // key so it stays unique if the rollup ever spans dimensions, though this table only
            // renders with one selected.
            rowKey={(row) => `${row.kind}-${row.code}`}
            columns={columns}
            dataSource={assigned}
            // The table owns its own loading state rather than the page swapping in a
            // spinner: replacing the content unmounts `RegionMap`, which tears down and
            // rebuilds the Google map and collapses the page height, so the reader's scroll
            // position jumps. `rowsLoading` also drives the inline indicator above.
            loading={rowsLoading}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        </>
      )}

      {/* Reachable in both views: an ungrouped reader — the default view — must still see that
          some interactions could not be attributed to anything. It is one figure per bucket and
          it does not invite the cross-dimension sum the grouped view exists to avoid. */}
      {!rowsLoading && unassigned.length > 0 && (
        // Readable rather than grey-on-grey, which read as disabled. The dimension is named
        // when there is one, because without it every row says the same thing: one unassigned
        // row per dimension, all labelled "Outside all boundaries", so 23 and 291 looked like
        // duplicates of each other instead of two different groupings. Ungrouped, each row
        // names its own dimension instead (see `unassignedRowLabel`).
        <div className="mt-4 rounded border border-neutral-200 bg-white p-3">
          <Text strong>{unassignedTitle}</Text>
          <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-sm">
            {unassigned.map((row) => (
              <li
                key={`${row.kind}-${row.unassignedReason ?? ''}-${row.code}`}
                className="flex items-baseline gap-2"
              >
                <span className="text-neutral-700">
                  {unassignedRowLabel(row, dimension)}
                </span>
                <Text strong>{row.count.toLocaleString()}</Text>
                <Text type="secondary">interactions</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
