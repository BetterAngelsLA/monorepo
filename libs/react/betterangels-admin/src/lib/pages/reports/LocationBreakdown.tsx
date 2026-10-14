import { Column } from '@ant-design/charts';
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  RegionDimension,
  UnassignedReason,
} from '@monorepo/ba-platform/types';
import { ChartCard, useNoAutofill } from '../../components';
import {
  useInteractionMap,
  useInteractionsByRegion,
  useRegionDimensions,
  type RegionCountType,
} from './hooks';
import { RegionMap } from './RegionMap';

const { Text } = Typography;

const GENERIC_ERROR_MESSAGE = 'Sorry, something went wrong. Please try again.';

/**
 * Display names for the dimensions. The enum values are GraphQL identifiers
 * (COUNCIL_DISTRICT); these are what a program manager reads.
 */
/** Enum value (`council_district`) -> prose label. Keys are the wire values. */
const KIND_LABELS: Record<string, string> = {
  zip: 'ZIP Code',
  city: 'City',
  council_district: 'City Council District',
  supervisorial_district: 'Supervisorial District',
  spa: 'Service Planning Area',
  coc: 'Continuum of Care',
};

const DIMENSION_LABELS: Record<RegionDimension, string> = {
  [RegionDimension.Zip]: 'ZIP Code',
  [RegionDimension.City]: 'City',
  [RegionDimension.CouncilDistrict]: 'City Council District',
  [RegionDimension.SupervisorialDistrict]: 'Supervisorial District',
  [RegionDimension.Spa]: 'Service Planning Area',
  [RegionDimension.Coc]: 'Continuum of Care',
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
/** Prose label for a bucket's `kind`; falls back to the raw value if it is unknown. */
function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
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
  const [dimension, setDimension] = useState<RegionDimension | undefined>(undefined);

  // Regions to narrow the map to — "show me the SPA 4 visits". Empty means the whole
  // dimension.
  // A list rather than one code: comparing two districts side by side is the common
  // question ("where are we strong in 8 versus 9?"), and the plumbing is already a list
  // the whole way down to the API, so single-select was an artificial restriction.
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const controlsRef = useNoAutofill();

  const { dimensions, error: dimensionsError } = useRegionDimensions();

  // Two rollups over the same dimension, because they answer different questions.
  //
  // `availableRegions` is unfiltered and exists to populate the region picker. A
  // multi-select cannot be built from the filtered result: choosing district 1 would
  // re-query for district 1 alone, the option list would collapse to that one row, and
  // there would be no way to ever choose a second. That is exactly what went wrong.
  //
  // `rows` is scoped to the selection and is what the table, the figures and the map
  // reflect.
  const { rows: availableRegions } = useInteractionsByRegion({
    organizationId,
    dimension,
    startDate,
    endDate,
  });

  const {
    rows,
    loading: rowsLoading,
    error,
  } = useInteractionsByRegion({
    organizationId,
    dimension,
    startDate,
    endDate,
    // The drill-down has to reach the rollup, not just the map: `RegionMap` draws the
    // polygons for the regions it is given, so without this the shapes never change
    // however the map is filtered.
    regionCodes: selectedCodes.length > 0 ? selectedCodes : undefined,
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
  const { points, truncated, error: mapError } = useInteractionMap({
    organizationId,
    startDate,
    endDate,
    // The heatmap ignores the *grouping* — a group-by re-partitions the same interactions
    // rather than selecting different ones, so it must not move the surface. It does
    // honour the *drill-down*, because narrowing to SPA 4 and still seeing the whole
    // county is the bug this fixes: no interaction should sit outside the shapes drawn.
    //
    // `dimension` travels with it because a code cannot be resolved without one, and the
    // API rejects codes that arrive without it rather than guessing.
    dimension,
    regionCodes: selectedCodes.length > 0 ? selectedCodes : undefined,
  });

  // The last non-empty set of rows, kept so a refetch does not blank the panel.
  //
  // `loading` goes true on every variable change, and rendering a spinner instead of
  // the content unmounts `RegionMap` — which tears down and rebuilds the Google map —
  // and collapses the page height, so the reader's scroll position jumps. Holding the
  // previous rows keeps the layout stable and the map alive; the spinner becomes an
  // inline affordance rather than a replacement for everything.
  const [settledRows, setSettledRows] = useState<RegionCountType[]>([]);
  useEffect(() => {
    if (!rowsLoading && rows.length > 0) {
      setSettledRows(rows);
    }
  }, [rows, rowsLoading]);

  const shown = rowsLoading && rows.length === 0 ? settledRows : rows;
  const assigned = useMemo(
    () => shown.filter((r) => !r.isUnassigned && r.count > 0),
    [shown],
  );

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

  const selectable = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const matching =
      needle === ''
        ? pickable
        : pickable.filter((row) =>
            `${row.name} ${row.code}`.toLowerCase().includes(needle),
          );
    return [...matching].sort((a, b) => compareRegionCodes(a.code, b.code));
  }, [pickable, filter]);

  const unassigned = useMemo(() => shown.filter((r) => r.isUnassigned), [shown]);
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
  const dimensionName = dimension ? DIMENSION_LABELS[dimension] : 'all dimensions';

  // Selecting a different dimension invalidates the codes: "4" is an SPA and also a Long
  // Beach council district, so a selection cannot carry across.
  useEffect(() => {
    setSelectedCodes([]);
  }, [dimension]);
  const queryError = error ?? dimensionsError ?? mapError;

  // Backend error bodies are not user-facing copy: log the real error and show a
  // generic message instead.
  useEffect(() => {
    if (queryError) {
      console.error(queryError);
    }
  }, [queryError]);

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
    { title: 'Code', dataIndex: 'code', key: 'code' },
    {
      title: 'Interactions',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
    },
  ];

  if (queryError) {
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
    <ChartCard title="Interactions by Location" className={className}>
      <div ref={controlsRef} className="mb-4 flex flex-wrap items-center gap-3">
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
            label: DIMENSION_LABELS[d] ?? d,
          }))}
          filterOption={(input, option) =>
            matches((option?.label as string) ?? '', input)
          }
        />
      </div>

      {dimension !== undefined && (
        <div className="mb-4 rounded-lg border border-neutral-90 p-3">
          <div className="mb-2 flex max-w-md items-baseline justify-between gap-2">
            {/* No "All regions" checkbox. It read as a peer of the regions when it is not
                one, and it was redundant: an empty selection already *is* "all" — that is
                how the API reads an absent `regionCodes`, and how the grouping's own
                "All dimensions" works. The state says which it is, and clearing is an
                action rather than a value. */}
            <Text type="secondary">
              {selectedCodes.length === 0
                ? `Show — all ${dimensionName.toLowerCase()}s`
                : `Show — ${selectedCodes.length} of ${pickable.length}`}
            </Text>
            {selectedCodes.length > 0 && (
              <Button type="link" size="small" onClick={() => setSelectedCodes([])}>
                Clear
              </Button>
            )}
          </div>
          <Input
            allowClear
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={`Filter ${dimensionName.toLowerCase()}s by name or code`}
            className="mb-2 max-w-xs"
          />
          {selectable.length === 0 ? (
            <Text type="secondary">
              {selectable.length === 0 && filter.trim() === ''
                ? 'No interactions in this range.'
                : 'Nothing matches that filter.'}
            </Text>
          ) : (
            <div className="max-h-56 overflow-y-auto pr-1">
              <Checkbox.Group
                className="flex w-full flex-col gap-2"
                value={selectedCodes}
                // The values are region codes, which are strings, so narrow rather than
                // cast — `Checkbox.Group` types its change as `CheckboxValueType[]`.
                onChange={(next) =>
                  setSelectedCodes(next.filter((v): v is string => typeof v === 'string'))
                }
                options={selectable.map((row) => ({
                  value: row.code,
                  label: `${row.name || row.code} (${row.count.toLocaleString()})`,
                }))}
              />
            </div>
          )}
        </div>
      )}

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

      {hasData && (
        <div className="mb-5">
          <RegionMap
            dimension={dimension}
            rows={shown}
            points={points}
            truncated={truncated}
            hasMapsKey={hasMapsKey}
            filteredTo={filteredToName}
            focusCodes={selectedCodes}
          />
        </div>
      )}

      {hasData && (
        <>
          <Column
            data={assigned.slice(0, 20)}
            xField="name"
            yField="count"
            height={300}
            xAxis={{ label: { autoRotate: true, style: { fontSize: 10 } } }}
            yAxis={{ title: { text: 'Interactions' } }}
            color="#1B3A5C"
          />
          <Table<RegionCountType>
            className="mt-4"
            size="small"
            rowKey={(row) =>
              `${row.isUnassigned}-${row.unassignedReason ?? ''}-${row.code}`
            }
            columns={columns}
            dataSource={shown}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        </>
      )}

      {!rowsLoading && unassigned.length > 0 && (
        <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-3">
          <Text strong>
            Not attributed to {dimension ? `a ${dimensionName.toLowerCase()}` : 'any region'}
          </Text>
          <ul className="mt-2 mb-0 list-disc pl-5 text-sm text-neutral-600">
            {unassigned.map((row) => (
              <li key={`${row.unassignedReason}-${row.code}`}>
                {unassignedLabel(row)}:{' '}
                <Text strong>{row.count.toLocaleString()}</Text>{' '}
                <Text type="secondary">interactions</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
