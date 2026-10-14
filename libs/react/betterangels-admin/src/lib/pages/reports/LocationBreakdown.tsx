import { Column } from '@ant-design/charts';
import {
  Alert,
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
import { ChartCard } from '../../components';
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
export function LocationBreakdown({
  organizationId,
  startDate,
  endDate,
  hasMapsKey = true,
  className = '',
}: LocationBreakdownProps) {
  const [dimension, setDimension] = useState<RegionDimension>(
    RegionDimension.CouncilDistrict,
  );

  // A single region to narrow the map to — "show me the SPA 4 visits". Empty means
  // every interaction in range. Single rather than multi: the rollup already shows
  // all regions, so this control exists to drill into one, and a multi-select on a
  // map reads as "highlight these", which the map does not do.
  const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined);

  const { dimensions, error: dimensionsError } = useRegionDimensions();
  const { rows, loading, error } = useInteractionsByRegion({
    organizationId,
    dimension,
    startDate,
    endDate,
  });
  // The pins and density views. Both come back in one request, so switching
  // between them on the map costs nothing; the dimension does not apply, because
  // an interaction's location is the same point whichever way the regions are cut.
  const {
    points,
    density,
    truncated,
    error: mapError,
  } = useInteractionMap({
    organizationId,
    startDate,
    endDate,
    dimension,
    regionCodes: selectedCode ? [selectedCode] : [],
  });

  const assigned = useMemo(
    () => rows.filter((r) => !r.isUnassigned && r.count > 0),
    [rows],
  );
  const hasData = !loading && assigned.length > 0;

  const unassigned = useMemo(() => rows.filter((r) => r.isUnassigned), [rows]);
  // Resolved above the JSX rather than inline: the styleguide asks for `if`/`else`
  // over a ternary whose branch is a call, and `??` rather than `||` — an empty name
  // is a legitimate value the importer can produce, and `||` would silently swap in
  // the code instead.
  const filteredToName = useMemo(() => {
    if (!selectedCode) {
      return undefined;
    }
    const match = assigned.find((row) => row.code === selectedCode);
    return match === undefined ? selectedCode : match.name || selectedCode;
  }, [assigned, selectedCode]);
  // Named regions with interactions, which is what the drill-down offers. The
  // unassigned buckets are excluded: they have no code to filter by.

  const dimensionName = DIMENSION_LABELS[dimension];

  // Selecting a different dimension invalidates the code: "4" is an SPA and also a
  // Long Beach council district.
  useEffect(() => {
    setSelectedCode(undefined);
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
    {
      title: dimensionName,
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Text type="secondary">Group by</Text>
        <Select
          value={dimension}
          onChange={setDimension}
          style={{ minWidth: 220 }}
          options={dimensions.map((d) => ({
            value: d,
            label: DIMENSION_LABELS[d] ?? d,
          }))}
        />
        <Text type="secondary">Show</Text>
        <Select
          allowClear
          value={selectedCode}
          onChange={(value) => setSelectedCode(value)}
          style={{ minWidth: 220 }}
          placeholder={`All ${dimensionName.toLowerCase()}s`}
          options={assigned.map((row) => ({
            value: row.code,
            label: `${row.name || row.code} (${row.count.toLocaleString()})`,
          }))}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spin size="small" /> Loading {dimensionName.toLowerCase()} data...
        </div>
      )}

      {!loading && !hasData && (
        <p className="text-center text-neutral-500">
          No located interactions for this range.
        </p>
      )}

      {hasData && (
        <div className="mb-5">
          <RegionMap
            dimension={dimension}
            rows={rows}
            points={points}
            density={density}
            truncated={truncated}
            hasMapsKey={hasMapsKey}
            filteredTo={filteredToName}
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
            dataSource={rows}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        </>
      )}

      {!loading && unassigned.length > 0 && (
        <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-3">
          <Text strong>Not attributed to a {dimensionName.toLowerCase()}</Text>
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
