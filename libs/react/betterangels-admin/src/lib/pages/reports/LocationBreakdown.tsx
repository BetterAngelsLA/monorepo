import { Column } from '@ant-design/charts';
import { useQuery } from '@apollo/client/react';
import { Select, Spin, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { ChartCard } from '../../components';
import { RegionDimension } from '@monorepo/ba-platform/types';
import type { InteractionsByRegionQuery } from './__generated__/regions.generated';
import {
  InteractionsByRegionDocument,
  RegionDimensionsDocument,
} from './__generated__/regions.generated';

/**
 * The generated operations export their whole `Query` type rather than per-field
 * types (the config only generates operations here; base types live in
 * `@monorepo/ba-platform/types`), so the row type is derived from it.
 */
type RegionCountType = InteractionsByRegionQuery['interactionsByRegion'][number];

const { Text } = Typography;

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
const UNASSIGNED_LABELS: Record<string, string> = {
  NO_LOCATION: 'No location on file',
  OUTSIDE_ALL_REGIONS: 'Outside all boundaries',
};

function unassignedLabel(row: RegionCountType): string {
  return UNASSIGNED_LABELS[row.unassignedReason ?? ''] ?? 'Unassigned';
}

/**
 * Interactions grouped by geography.
 *
 * The API returns the unassigned buckets as rows with `isUnassigned` set rather
 * than omitting them, so that a client outside every boundary is visible instead of
 * silently dropped. They are excluded from the chart — an 8,000-count "Unassigned"
 * bar next to districts numbering in the dozens distorts the comparison — and shown
 * beneath it as their own figures.
 */
export default function LocationBreakdown({
  organizationId,
  startDate,
  endDate,
}: {
  organizationId: string;
  startDate: string;
  endDate: string;
}) {
  const [dimension, setDimension] = useState<RegionDimension>(RegionDimension.CouncilDistrict);

  const { data: dimensionsData } = useQuery(RegionDimensionsDocument);
  const { data, loading } = useQuery(InteractionsByRegionDocument, {
    variables: { organizationId, dimension, startDate, endDate },
    skip: !organizationId,
  });

  const rows = useMemo(() => data?.interactionsByRegion ?? [], [data]);
  const assigned = useMemo(
    () => rows.filter((r) => !r.isUnassigned && r.count > 0),
    [rows],
  );
  const unassigned = useMemo(() => rows.filter((r) => r.isUnassigned), [rows]);

  const dimensions = dimensionsData?.regionDimensions ?? [];
  const dimensionName = DIMENSION_LABELS[dimension] ?? dimension;

  const columns = [
    {
      title: dimensionName,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row: RegionCountType) =>
        row.isUnassigned ? (
          <Text type="secondary">
            {unassignedLabel(row)} <Tag>{name}</Tag>
          </Text>
        ) : (
          (name || row.code)
        ),
    },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    {
      title: 'Interactions',
      dataIndex: 'count',
      key: 'count',
      align: 'right' as const,
      sorter: (a: RegionCountType, b: RegionCountType) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <ChartCard title="Interactions by Location">
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
          <Table
            className="mt-4"
            size="small"
            rowKey={(row: RegionCountType) =>
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
