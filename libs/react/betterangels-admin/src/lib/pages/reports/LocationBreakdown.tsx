import {
  Alert,
  Radio,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RegionDimension, UnassignedReason } from '@monorepo/ba-platform/types';
import { ChartCard, useNoAutofill } from '../../components';
import {
  useInteractionMap,
  useInteractionsByRegion,
  useRegionDimensions,
  type RegionCountType,
} from './hooks';
import { RegionMap, type MapView } from './RegionMap';

const { Text } = Typography;

const GENERIC_ERROR_MESSAGE = 'Sorry, something went wrong. Please try again.';

/**
 * Display names for the dimensions, keyed by the **wire** value (`council_district`).
 *
 * One map, not two. There were previously two — this one and a
 * `Record<RegionDimension, string>` — holding the same six strings, so a rename had to be
 * made twice or the table and the dropdown would disagree. String-keyed rather than keyed by
 * the enum because a bucket's `kind` arrives off the wire as a plain string and may be a
 * value this build does not know; an unknown key falls back to the raw value.
 */
const DIMENSION_LABELS: Record<string, string> = {
  zip: 'ZIP Code',
  city: 'City',
  council_district: 'City Council District',
  supervisorial_district: 'Supervisorial District',
  spa: 'Service Planning Area',
  coc: 'Continuum of Care',
};

/**
 * Dimension display order, as a string-keyed lookup.
 *
 * A `Record<RegionDimension, …>` forces a cast at the call site, because the `kind` on a
 * bucket arrives as a plain string; keying by string keeps the lookup honest and tolerates a
 * value the client does not know.
 */
const KIND_ORDER = new Map<string, number>(
  Object.values(RegionDimension).map((dimension, index) => [dimension, index]),
);

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

function unassignedLabel(row: RegionCountType): string {
  if (!row.unassignedReason) return 'Unassigned';
  return UNASSIGNED_LABELS[row.unassignedReason] ?? 'Unassigned';
}

function renderRegionName(name: string, row: RegionCountType) {
  if (row.isUnassigned) {
    return (
      <Text type="secondary">
        {unassignedLabel(row)} <Tag>{name}</Tag>
      </Text>
    );
  }
  // An empty name means the backend has no display label; the code is the fallback.
  return name || row.code;
}

type LocationBreakdownProps = {
  organizationId: string;
  startDate: string;
  endDate: string;
  hasMapsKey?: boolean;
  className?: string;
};

/**
 * Interactions grouped by geography.
 *
 * The API returns the unassigned buckets as rows with `isUnassigned` set rather
 * than omitting them, so that a client outside every boundary is visible instead of
 * silently dropped. They are excluded from the chart — an 8,000-count "Unassigned"
 * bar next to districts numbering in the dozens distorts the comparison — and shown
 * beneath it as their own figures.
 */
/**
 * Prose label for a dimension. Accepts either spelling.
 *
 * The wire `kind` is lowercase (`council_district`) and `RegionDimension` spells the same
 * dimension uppercase (`COUNCIL_DISTRICT`), so both have to resolve — the map is keyed by the
 * wire value. Unknown keys fall back to the raw value, so a dimension this build has never
 * heard of still renders.
 */
function kindLabel(kind: string): string {
  return DIMENSION_LABELS[kind] ?? DIMENSION_LABELS[kind.toLowerCase()] ?? kind;
}

/**
 * Case-insensitive substring match on the option's searchable text.
 *
 * Matching the code as well as the name is the point: a reader looking for council
 * district 13 types "13", not "Adrin Nazarian".
 */
function matches(text: string, input: string): boolean {
  return text.toLowerCase().includes(input.trim().toLowerCase());
}

export function LocationBreakdown({
  organizationId,
  startDate,
  endDate,
  hasMapsKey = true,
  className = '',
}: LocationBreakdownProps) {
  // `undefined` is "All dimensions", and it is the default: the page opens on the whole
  // picture rather than on one arbitrary grouping. The rollup then counts every dimension
  // at once and each bucket carries its own `kind`. Codes are meaningless across
  // dimensions, so the drill-down stays disabled until one is chosen.
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
  const [view, setView] = useState<MapView>('heatmap');

  const controlsRef = useNoAutofill();

  const { dimensions, error: dimensionsError } = useRegionDimensions();

  /**
   * **One rollup, unfiltered.** The drill-down is applied locally below.
   *
   * This used to be two `interactionsByRegion` calls over the same dimension — one
   * unfiltered for the picker, one scoped to `selectedCodes` for the table and figures.
   * The scoped call was redundant: `region_rollup` with codes returns exactly the subset
   * of the unfiltered buckets whose code was asked for (`keep_unassigned` is false when
   * codes are given, so nothing extra is added), so the same rows were already in hand.
   * Two round trips per drill-down became none.
   *
   * The picker still needs the *unfiltered* set — a multi-select built from the filtered
   * result collapses to the one region chosen and can never select a second, which is the
   * bug that motivated the second query in the first place. Keeping the unfiltered rollup
   * as the single source satisfies both: `availableRegions` is it, `shown` is a view of it.
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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    const element = mapRef.current;
    if (!element || mapVisible) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMapVisible(true);
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [mapVisible]);

  const {
    points,
    truncated,
    error: mapError,
  } = useInteractionMap({
    organizationId,
    startDate,
    endDate,
    // The heatmap ignores the *grouping* — a group-by re-partitions the same interactions
    // rather than selecting different ones, so it must not move the surface. It does
    // honour the *drill-down*, because narrowing to SPA 4 and still seeing the whole
    // county is the bug this fixes: no interaction should sit outside the shapes drawn.
    //
    // `dimension` travels with the drill-down only, for the same reason: a code cannot be
    // resolved without one, and the API rejects codes that arrive without it rather than
    // guessing. Sending it when nothing is selected would contradict the paragraph above —
    // it changes the query's variables without changing its answer, so Apollo re-fetches a
    // 10,000-point page (1 MB) for a result that is byte-for-byte identical, on every
    // group-by. Measured against the live backend.
    dimension: selectedCodes.length > 0 ? dimension : undefined,
    regionCodes: selectedCodes.length > 0 ? selectedCodes : undefined,
    enabled: mapVisible,
  });

  /**
   * The reader's selection applied to the one rollup.
   *
   * No "hold the last good rows while loading" state machine any more: that existed to stop
   * a refetch blanking the panel and unmounting `RegionMap` (which tears down and rebuilds
   * the Google map, jumping the reader's scroll position). Changing the selection no longer
   * triggers a fetch at all, and `availableRegions` keeps its previous value while a real
   * refetch is in flight, so the layout is stable without it.
   */
  const shown = useMemo(() => {
    if (selectedCodes.length === 0) {
      return availableRegions;
    }
    // Two predicates, both mirroring `region_rollup` so the local view cannot drift from
    // what the API would have returned for the same codes:
    //
    // 1. keep only the named buckets asked for (the `region__code__in` arm);
    // 2. **drop the unassigned buckets.** They are not regions and have no code, so they
    //    cannot match a selection — and the backend drops them too, because
    //    `keep_unassigned` is false whenever codes are given. Filtering on `code` alone
    //    would keep them, which reads as "outside all boundaries: 291" beside a
    //    drill-down into two districts.
    return availableRegions.filter(
      (row) => !row.isUnassigned && selectedCodes.includes(row.code),
    );
  }, [availableRegions, selectedCodes]);

  /**
   * Sorted for reading. Two things are wrong with the raw order.
   *
   * Within a dimension, codes arrive in database order, which for numbers is dictionary
   * order — "1", "10", "11", "2". And across dimensions there is no order at all, so
   * "All dimensions" interleaved a city, a ZIP and a CoC by count, which reads as an
   * unsorted list of 133 rows across 14 pages. Grouping by dimension first makes that view
   * navigable; within each dimension the count still decides, because that is the question.
   */
  const assigned = useMemo(() => {
    const rowsWithCounts = shown.filter((r) => !r.isUnassigned && r.count > 0);
    if (dimension !== undefined) {
      return rowsWithCounts;
    }
    // A lookup keyed by a string, so no cast: a bucket's `kind` is a plain string off the
    // wire, and an unexpected one sorts last rather than throwing.
    const order = (kind: string) =>
      KIND_ORDER.get(kind) ?? Number.MAX_SAFE_INTEGER;
    return [...rowsWithCounts].sort((a, b) => {
      const byKind = order(a.kind) - order(b.kind);
      if (byKind !== 0) {
        return byKind;
      }
      return b.count - a.count;
    });
  }, [shown, dimension]);

  /**
   * Sorted for reading, not for the API.
   *
   * Codes arrive in whatever order the database returns them, which for numeric codes is
   * dictionary order — "1", "10", "11", "2" — and reads as unsorted. Numeric codes are
   * therefore compared as numbers and everything else alphabetically, so ZIP codes and
   * cities stay in a sensible order too.
   */
  function compareRegionCodes(a: string, b: string): number {
    const an = Number(a);
    const bn = Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) {
      return an - bn;
    }
    return a.localeCompare(b);
  }
  // `hasData` deliberately ignores `loading`: a refetch must not unmount the map.
  const hasData = assigned.length > 0;

  // The checkbox list searches name *and* code, because a code is what a reader usually
  // has to hand ("district 13") and it is not what the label shows.
  /** Every region of the dimension that has interactions — the picker's full set. */
  const pickable = useMemo(
    () => availableRegions.filter((row) => !row.isUnassigned && row.count > 0),
    [availableRegions],
  );

  /** Sorted for reading: numeric codes as numbers, everything else alphabetically. */
  const selectable = useMemo(
    () => [...pickable].sort((a, b) => compareRegionCodes(a.code, b.code)),
    [pickable],
  );

  const unassigned = useMemo(
    () => shown.filter((r) => r.isUnassigned),
    [shown],
  );
  // Resolved above the JSX rather than inline: the styleguide asks for `if`/`else`
  // over a ternary whose branch is a call, and `??` rather than `||` — an empty name
  // is a legitimate value the importer can produce, and `||` would silently swap in
  // the code instead.
  const filteredToName = useMemo(() => {
    if (selectedCodes.length === 0) {
      return undefined;
    }
    return selectedCodes
      .map((code) => {
        const match = assigned.find((row) => row.code === code);
        return match === undefined ? code : match.name || code;
      })
      .join(', ');
  }, [assigned, selectedCodes]);
  // Named regions with interactions, which is what the drill-down offers. The
  // unassigned buckets are excluded: they have no code to filter by.

  // Used for prose only ("Loading city council district data"). Absent means the rollup
  // spans every dimension, so there is no single name to interpolate.
  const dimensionName = dimension ? kindLabel(dimension) : 'all dimensions';

  // Selecting a different dimension invalidates the codes: "4" is an SPA and also a Long
  // Beach council district, so a selection cannot carry across.
  useEffect(() => {
    setSelectedCodes([]);
  }, [dimension]);

  /**
   * **Two error states, not one.** The rollup and the map are separate queries with separate
   * authorities, so one failing must not take the other down.
   *
   * `interactionMap` returns individual coordinates and is gated on the note read scope, so it
   * is *expected* to be refused for a role that may read the report but not notes — the
   * backend's own test asserts that refusal. Folding it into the panel-wide `queryError` (as
   * this did) replaced the whole card — rollup, chart, table — with "Something went wrong" for
   * exactly that role, hiding data the reader was entitled to. The map now degrades in place,
   * the way a missing Maps key already did.
   *
   * `dimensionsError` *is* panel-wide: without the dimension list there is no grouping to
   * choose, which is the panel's reason to exist.
   */
  const panelError = dimensionsError ?? error;
  const mapFailed = mapError !== undefined;

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

  const columns: TableColumnsType<RegionCountType> = [
    // Only when the rollup spans every dimension. A code is ambiguous without it, so
    // two rows both named "1" would otherwise be indistinguishable.
    ...(dimension === undefined
      ? [
          {
            title: 'Grouped by',
            dataIndex: 'kind' as const,
            key: 'kind',
            render: (kind: string) => kindLabel(kind),
          },
        ]
      : []),
    {
      title: dimension ? dimensionName : 'Region',
      dataIndex: 'name',
      key: 'name',
      render: renderRegionName,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      // antd's data-format spec: show `-` when there is no value. An unassigned bucket has
      // no code, and a blank cell there is indistinguishable from a failed render.
      render: (code: string) => (code ? code : <Text type="secondary">-</Text>),
    },
    {
      title: 'Interactions',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
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
          value={view}
          onChange={(event) => setView(event.target.value)}
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
          They previously sat under the page's charts, ~640px from the map, so changing
          them moved things the reader could not see.
          
          Side by side once there is room, stacked below that: they are two halves of one
          question ("grouped how, showing which"), and a column of them wastes a wide screen
          while a row of them would crush the controls on a narrow one. */}
      <div
        ref={controlsRef}
        className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6"
      >
        <div className="flex shrink-0 flex-col gap-1">
          <Text type="secondary">Group by</Text>
          <Select
            showSearch
            // Clears to "All" — the rollup then spans every dimension, and each row
            // carries its own `kind` so the table can say which it came from.
            allowClear
            value={dimension}
            onChange={(value) => {
              setDimension(value);
              setSelectedCodes([]);
            }}
            style={{ minWidth: 220 }}
            placeholder="All dimensions"
            options={dimensions.map((d) => ({
              value: d,
              label: kindLabel(d),
            }))}
            filterOption={(input, option) =>
              matches((option?.label as string) ?? '', input)
            }
          />
        </div>

        {dimension !== undefined && (
          <div className="flex min-w-0 flex-1 flex-col gap-1 lg:max-w-xl">
            <Text type="secondary">Show</Text>
            {/* A searchable multi-select with the selection kept visible as removable pills.
              The earlier attempt at this collapsed after every pick, for two reasons that
              are both now fixed: the options were derived from the *filtered* rollup, so
              choosing one region deleted the others from the list, and the dropdown itself
              closes on select in multiple mode. */}
            <Select
              mode="multiple"
              showSearch
              allowClear
              // The options come from the unfiltered rollup, so choosing one never removes
              // the others from the list.
              options={selectable.map((row) => ({
                value: row.code,
                label: `${row.name || row.code} (${row.count.toLocaleString()})`,
                searchText: `${row.name} ${row.code}`,
              }))}
              value={selectedCodes}
              onChange={setSelectedCodes}
              // Keeps the pills from growing without bound; the overflow is the "+N" chip.
              // A fixed cap rather than `responsive`: antd's responsive mode renders the
              // overflow chip even when nothing is hidden, so three selected regions showed a
              // stray "+ 0 ..." beside them. Capping at two is also more honest — a "+N" that
              // always means N things you cannot see.
              maxTagCount={2}
              placeholder={`All ${dimensionName.toLowerCase()}s`}
              style={{ width: '100%' }}
              // Searches the name *and* the code, because a reader usually has the code in
              // hand ("district 13") and it is not what the label starts with.
              filterOption={(input, option) =>
                matches((option?.searchText as string) ?? '', input)
              }
            />
            <div className="text-xs text-neutral-500">
              {selectedCodes.length === 0
                ? `No selection means every ${dimensionName.toLowerCase()} in range.`
                : `${selectedCodes.length} of ${pickable.length} selected — clear the control to show all.`}
            </div>
          </div>
        )}
      </div>

      {rowsLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spin size="small" /> Loading{' '}
          {dimension ? `${dimensionName.toLowerCase()} ` : ''}data...
        </div>
      )}

      {!rowsLoading && !hasData && (
        <p className="text-center text-neutral-500">
          No located interactions for this range.
        </p>
      )}

      <div ref={mapRef}>
      {hasData && (
        <div className="mb-5">
          <RegionMap
            dimension={dimension}
            rows={shown}
            points={points}
            truncated={truncated}
            hasMapsKey={hasMapsKey}
            failed={mapFailed}
            filteredTo={filteredToName}
            focusCodes={selectedCodes}
            view={view}
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
          <Table<RegionCountType>
            className="mt-4"
            size="small"
            // Includes `kind`: unassigned rows share an empty code and reason, so without
            // it the six dimensions collide on one key.
            rowKey={(row) =>
              `${row.kind}-${row.isUnassigned}-${row.unassignedReason ?? ''}-${row.code}`
            }
            columns={columns}
            dataSource={shown}
            // The table owns its own loading state rather than the page swapping in a
            // spinner: replacing the content unmounts `RegionMap`, which tears down and
            // rebuilds the Google map and collapses the page height, so the reader's scroll
            // position jumps. `rowsLoading` also drives the inline indicator above.
            loading={rowsLoading}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        </>
      )}

      {/* Reachable in both views. The guard used to be `dimension !== undefined && …`, which
          was dead: the only sibling that renders this is inside `hasData && dimension !==
          undefined`, and the ungrouped branch above returns a prompt instead. The effect was
          that an ungrouped reader — the default view — never saw that 318 interactions could
          not be attributed to anything. It is one figure and it does not invite the
          cross-dimension sum the table was removed for, so it belongs here too. */}
      {!rowsLoading && unassigned.length > 0 && (
        // Readable rather than grey-on-grey, which read as disabled. The dimension is named
        // when there is one, because without it every row says the same thing: one unassigned
        // row per dimension, all labelled "Outside all boundaries", so 23 and 291 looked like
        // duplicates of each other instead of two different groupings. Ungrouped, each row
        // names its own dimension instead (see `unassignedLabel` and the row below).
        <div className="mt-4 rounded border border-neutral-200 bg-white p-3">
          <Text strong>
            {dimension !== undefined
              ? `Not attributed to a ${dimensionName.toLowerCase()}`
              : 'Not attributed to a region'}
          </Text>
          <ul className="mt-2 mb-0 list-none space-y-1 p-0 text-sm">
            {unassigned.map((row) => (
              <li
                key={`${row.kind}-${row.unassignedReason ?? ''}-${row.code}`}
                className="flex items-baseline gap-2"
              >
                {/* Ungrouped, the same label repeats once per dimension, so the kind is what
                    tells the rows apart — 23 and 291 are different populations, not a dupe. */}
                <span className="text-neutral-700">
                  {unassignedLabel(row)}
                  {dimension === undefined && row.kind
                    ? ` (${kindLabel(row.kind)})`
                    : ''}
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
