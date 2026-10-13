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

  const { dimensions, error: dimensionsError } = useRegionDimensions();
  const { rows, loading, error } = useInteractionsByRegion({
    organizationId,
    dimension,
    startDate,
    endDate,
  });

  const assigned = useMemo(
    () => rows.filter((r) => !r.isUnassigned && r.count > 0),
    [rows],
  );
  const unassigned = useMemo(() => rows.filter((r) => r.isUnassigned), [rows]);

  const dimensionName = DIMENSION_LABELS[dimension] ?? dimension;
  const queryError = error ?? dimensionsError;

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
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spin size="small" /> Loading {dimensionName.toLowerCase()} data...
        </div>
      )}

      {!loading && assigned.length === 0 && (
        <p className="text-center text-neutral-500">
          No located interactions for this range.
        </p>
      )}

      {!loading && assigned.length > 0 && (
        <div className="mb-5">
          <RegionMap
            dimension={dimension}
            rows={rows}
            hasMapsKey={hasMapsKey}
          />
        </div>
      )}

      {!loading && assigned.length > 0 && (
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
