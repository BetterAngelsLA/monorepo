import {
  Alert,
  Radio,
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
  useInteractionScope,
  type RegionCountType,
} from './hooks';
import {
  displayName,
  kindLabel,
  regionBreakdownView,
  unassignedRowLabel,
  type DimensionInfo,
} from './regionBreakdown';
import { GENERIC_ERROR_MESSAGE, isRefusalError } from './reportErrors';
import { RegionMap, type MapView } from './RegionMap';

const { Text } = Typography;

type LocationBreakdownProps = {
  organizationId: string;
  startDate: string;
  endDate: string;
  /** The page's group; the map and table share it. */
  dimension?: RegionDimension;
  /** Specific regions within `dimension`; empty means every region of it. */
  selectedCodes: string[];
  /** The published dimension vocabulary, for the table's column name and prose. */
  dimensions: DimensionInfo[];
  /** The page's unfiltered rollup for `dimension`; the drill-down is derived from it. */
  rows: RegionCountType[];
  rowsLoading: boolean;
  /** The dimensions list or the rollup failed, so the card cannot be assembled. */
  panelError?: Error;
  hasMapsKey?: boolean;
  className?: string;
};

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
  dimension,
  selectedCodes,
  dimensions,
  rows,
  rowsLoading,
  panelError,
  hasMapsKey = true,
  className = '',
}: LocationBreakdownProps) {
  // Only the rendering choice is local. The grouping and the region selection belong to the
  // page, because they also scope every chart above this card.
  const [mapView, setMapView] = useState<MapView>('heatmap');

  // The heatmap stays county-wide: the grouping scopes the charts above, while the map is the
  // service-area context its boundaries are drawn over. A specific region selection does scope
  // it, because that is the reader saying "only these places".

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
    withheld: pointsWithheld,
    loading: pointsLoading,
    error: mapError,
  } = useInteractionMap({
    organizationId,
    startDate,
    endDate,
    // The density grid ignores the *grouping*: the surface is the whole service area, and the
    // grouping is drawn over it as boundaries, so "every city" can be read against everything
    // else. It does honour the *drill-down*, because narrowing to SPA 4 and still seeing the
    // whole county is the bug this fixes: no interaction should sit outside the shapes drawn.
    //
    // `dimension` travels with the drill-down only: a code cannot be resolved without one, and
    // the API rejects codes that arrive without it rather than guessing.
    dimension: selectedCodes.length > 0 ? dimension : undefined,
    regionCodes: selectedCodes.length > 0 ? selectedCodes : undefined,
    // Only the clusters view draws points. The density grid draws none of them — it is
    // aggregated on the server — so it asks `useInteractionScope` for the one flag it needs
    // instead of fetching a payload it would ignore.
    enabled: hasMapsKey && mapVisible && mapView === 'clusters',
  });

  /**
   * Whether the note scope withheld the interactions, for the view that cannot tell.
   *
   * A cell-free tile is a 204 whether the range was quiet or the scope removed every pin, so
   * the grid needs this answer from outside the tiles. Clusters takes it from `interactionMap`,
   * which it already holds.
   */
  const { withheld: scopeWithheld } = useInteractionScope({
    organizationId,
    startDate,
    endDate,
    enabled: hasMapsKey && mapVisible && mapView === 'heatmap',
  });

  /**
   * The reader's selection applied to the page's one rollup. Pure, and tested in
   * `regionBreakdown`.
   *
   * The layout is stable without a "hold the last good rows" state machine: changing the
   * selection does not trigger a fetch — the page keeps the previous rollup while a dimension
   * change is in flight — so the table and map keep their last good content until the new rows
   * arrive.
   */
  const breakdown = useMemo(
    () => regionBreakdownView(rows, selectedCodes),
    [rows, selectedCodes],
  );
  const { assigned, unassigned, hasData, hasLocatedRows } = breakdown;

  // Used for prose only ("Loading city council district data"). Absent means the rollup
  // spans every dimension, so there is no single name to interpolate.
  let dimensionName = 'all dimensions';
  if (dimension) {
    dimensionName = kindLabel(dimension, dimensions);
  }

  /**
   * **Two error states, not one.** The rollup and the map are separate queries with separate
   * authorities, so one failing must not take the other down.
   *
   * `interactionMap` is a second request over the same data: it can fail on its own — a 500, a
   * dropped connection, a validation error — while the rollup beside it succeeds. Folding it
   * into the panel-wide `panelError` replaced the whole card — rollup, table, figures — with
   * "Something went wrong", hiding data the reader was entitled to. The map degrades in place
   * instead, the way a missing Maps key already does.
   *
   * A **refusal** is the one failure that is not a fault, and it gets its own copy; see
   * `reportErrors`. The tile path applies the same rule, so the two halves of one refusal agree.
   *
   * `panelError` comes from the page, which owns the dimension list and the rollup: they also
   * feed the group control at the top of the screen, so their failure is page-wide rather than
   * this card's alone.
   */
  const mapRefused = mapError !== undefined && isRefusalError(mapError);
  const mapFailed = mapError !== undefined && !mapRefused;

  useEffect(() => {
    if (mapError) {
      console.error(mapError);
    }
  }, [mapError]);

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
      // The name already contains the code for every dimension ("90012", "2 - Adrin
      // Nazarian"), so a separate Code column only repeated it.
      render: (_: string, row: RegionCountType) => displayName(row),
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

  const unassignedPanel =
    !rowsLoading && unassigned.length > 0 ? (
      <div className="rounded border border-neutral-200 bg-white p-3">
        <Text strong>{unassignedTitle}</Text>
        <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-sm">
          {unassigned.map((row) => (
            <li
              key={`${row.kind}-${row.unassignedReason ?? ''}-${row.code}`}
              className="flex items-baseline gap-2"
            >
              <span className="text-neutral-700">
                {unassignedRowLabel(row, dimensions, dimension)}
              </span>
              <Text strong>{row.count.toLocaleString()}</Text>
              <Text type="secondary">interactions</Text>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

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
      {/* One card, two views of the same data. Wide screens put the table beside the map so
          overview and detail are visible together; below xl they stack. The grouping controls
          live at the top of the page, because they scope every chart too. */}

      {rowsLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spin size="small" /> {loadingLabel}
        </div>
      )}

      {!rowsLoading && !hasLocatedRows && (
        <p className="text-center text-neutral-500">
          No located interactions for this range.
        </p>
      )}

      <div
        className={
          dimension === undefined
            ? 'flex flex-col gap-4'
            : 'grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
        }
      >
        <div ref={triggerRef}>
          {hasLocatedRows && (
            <RegionMap
              dimension={dimension}
              points={points}
              pointsLoading={pointsLoading}
              truncated={truncated}
              hasMapsKey={hasMapsKey}
              refused={
                mapRefused ||
                (mapView === 'clusters' ? pointsWithheld : scopeWithheld)
              }
              failed={mapFailed}
              filteredTo={breakdown.filteredToName}
              focusCodes={selectedCodes}
              view={mapView}
              organizationId={organizationId}
              startDate={startDate}
              endDate={endDate}
              height={dimension === undefined ? 500 : 420}
            />
          )}
        </div>

        {dimension === undefined ? (
          <div className="flex flex-col gap-4">
            {hasLocatedRows && (
              /*
               * One item, because a *table* of every dimension cannot be read as a total. The six
               * dimensions are six views of the same interactions, so summing their rows gave
               * 6,588 against a true total of 1,098. Choosing one also scopes the charts above.
               */
              <div className="rounded border border-neutral-200 bg-white p-4">
                <Text strong>Choose a grouping for the regional breakdown</Text>
                <p className="mt-1 mb-0 text-sm text-neutral-600">
                  Each dimension covers the same interactions a different way,
                  so their rows can not be added together. Pick one to see its
                  regions and to scope the KPIs and charts above.
                </p>
              </div>
            )}
            {unassignedPanel}
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {hasData && (
              <>
                {/* The drill-down is empty while the range is not: distinct from "no located
                    interactions for this range" above, which is about the range itself. */}
                {!rowsLoading &&
                  selectedCodes.length > 0 &&
                  assigned.length === 0 && (
                    <p className="text-center text-sm text-neutral-500">
                      No interactions in the selected regions for this range.
                    </p>
                  )}
                <Table<RegionCountType>
                  size="small"
                  // The named regions of this dimension; a code is unique within one. `kind` is
                  // in the key so it stays unique if the rollup ever spans dimensions, though
                  // this table only renders with one selected.
                  rowKey={(row) => `${row.kind}-${row.code}`}
                  columns={columns}
                  dataSource={assigned}
                  // The table owns its own loading state rather than the page swapping in a
                  // spinner: replacing the content unmounts `RegionMap` and rebuilds the map.
                  loading={rowsLoading}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                />
              </>
            )}

            {/* Reachable in both views: an ungrouped reader must still see that some
                interactions could not be attributed to anything. */}
            {unassignedPanel}
          </div>
        )}
      </div>
    </ChartCard>
  );
}
