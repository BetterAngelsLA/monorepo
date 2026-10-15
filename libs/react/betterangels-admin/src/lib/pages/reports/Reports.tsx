import { Column, Pie } from '@ant-design/charts';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Skeleton,
  Statistic,
  theme,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useActiveOrg } from '@monorepo/ba-platform';
import { mergeCss } from '@monorepo/react/shared';
import { ChartCard } from '../../components';
import { useCSVDownload } from '../../hooks';
import { formatBucketLabel } from './formatBucketLabel';
import { useReportSummary } from './hooks';
import { LocationBreakdown } from './LocationBreakdown';

const { RangePicker } = DatePicker;

type IProps = {
  className?: string;
  hasMapsKey?: boolean;
};

const GENERIC_ERROR_MESSAGE = 'Sorry, something went wrong. Please try again.';

function getDefaultRange(): [Dayjs, Dayjs] {
  const now = dayjs();
  const start = now.subtract(1, 'month').startOf('month');
  const end = now.subtract(1, 'month').endOf('month');
  return [start, end];
}

function formatScalarDate(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

/**
 * A headline number that distinguishes "measured zero" from "nothing to measure".
 *
 * A bare `0` beside "1,098 interactions" reads as a contradiction, or worse as "you served
 * nobody". When the count is zero *and* there is other data, that is a gap in the record
 * rather than a finding, so it says so.
 */
function Metric({
  title,
  value,
  hasData,
  emptyHint,
}: {
  title: string;
  value: number;
  hasData: boolean;
  emptyHint: string;
}) {
  if (value === 0 && hasData) {
    return (
      <Statistic
        title={title}
        value="—"
        className="text-neutral-400"
        // The dash is only meaningful with the reason attached.
        suffix={<span className="text-xs font-normal">{emptyHint}</span>}
      />
    );
  }
  return <Statistic title={title} value={value} />;
}

function DownloadIcon({ isDownloading }: { isDownloading: boolean }) {
  if (isDownloading) {
    return <LoadingOutlined />;
  }
  return <DownloadOutlined />;
}

/**
 * Chart colours, from the design system rather than hand-picked.
 *
 * NOTE the prop: `@ant-design/charts` v2 colours marks through `style.fill`. A `color` prop is
 * silently ignored — verified by setting it to magenta and watching the chart render its
 * default blue regardless. Every chart on this page passed `color` and had therefore been
 * using G2's default palette all along.
 *
 * These were Material palette values floating in a Tailwind + antd app — `#1B3A5C` is a 2018
 * Material navy, `#2E7D32` is Material green 800. antd's colour spec is explicit that the
 * product palette is *derived from* the system palette, so a re-theme would have moved every
 * component except these four charts.
 *
 * Read through `useToken` rather than importing hexes, so a theme change flows through.
 */
function useChartColors() {
  const { token } = theme.useToken();
  return {
    primary: token.colorPrimary,
    success: token.colorSuccess,
    warning: token.colorWarning,
    purple: token.colorInfo,
  } as const;
}

export function Reports({ className = '', hasMapsKey = true }: IProps) {
  const CHART_COLORS = useChartColors();
  const { activeOrg } = useActiveOrg();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getDefaultRange);
  const {
    download,
    isDownloading,
    error: downloadError,
    clearError,
  } = useCSVDownload();

  const [startDate, endDate] = dateRange;
  const startStr = formatScalarDate(startDate);
  const endStr = formatScalarDate(endDate);

  const organizationId = activeOrg?.id ?? '';
  const { summary, loading, error } = useReportSummary({
    organizationId,
    startDate: startStr,
    endDate: endStr,
  });

  // Backend error bodies are not user-facing copy: log the real error and show a
  // generic message instead.
  useEffect(() => {
    if (downloadError) {
      console.error(downloadError);
    }
    if (error) {
      console.error(error);
    }
  }, [downloadError, error]);

  const orgName = activeOrg?.name ?? 'Your Organization';

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates?.[1]) {
      setDateRange([dates[0], dates[1]]);
      clearError();
    }
  };

  const handleDownload = () => download(startStr, endStr, activeOrg?.id);

  const totalServices =
    summary?.topProvidedServices?.reduce((s, x) => s + (x.count ?? 0), 0) ?? 0;

  return (
    <div className={mergeCss(['flex flex-col gap-6', className])}>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Interaction data for {orgName}
        </p>
      </div>

      {/* Controls */}
      <Card size="small">
        <div className="flex flex-wrap items-center gap-4">
          <RangePicker
            value={dateRange}
            onChange={handleRangeChange}
            format="YYYY-MM-DD"
            allowClear={false}
          />
          <Button
            type="primary"
            icon={<DownloadIcon isDownloading={isDownloading} />}
            loading={isDownloading}
            onClick={handleDownload}
          >
            Download CSV
          </Button>
        </div>
        {downloadError && (
          <Alert
            className="mt-4"
            type="error"
            showIcon
            message={GENERIC_ERROR_MESSAGE}
            closable
            onClose={clearError}
          />
        )}
      </Card>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          showIcon
          message={GENERIC_ERROR_MESSAGE}
          description="We could not load the report data."
        />
      )}

      {/* Loading. Skeletons rather than a spinner: antd's data-format spec asks for them, and
          they hold the page's shape so the content does not jump in when it arrives. */}
      {loading && (
        <div className="flex flex-col gap-4">
          <Row gutter={[16, 16]}>
            {[0, 1, 2, 3].map((i) => (
              <Col key={i} xs={24} sm={6}>
                <Card>
                  <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                </Card>
              </Col>
            ))}
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {summary && !loading && (
        <>
          {/* KPI row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Total Interactions"
                  value={summary.totalNotes}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Metric
                  title="Unique Clients"
                  value={summary.uniqueClients}
                  // Zero here while interactions exist reads as "you served nobody". It is
                  // the same zero as "nothing is recorded", and those are different claims.
                  emptyHint="No clients recorded on these interactions"
                  hasData={summary.totalNotes > 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Metric
                  title="Active Teams"
                  value={summary.notesByTeam?.length ?? 0}
                  emptyHint="No team recorded on these interactions"
                  hasData={summary.totalNotes > 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic title="Services Provided" value={totalServices} />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            {(summary.notesByDate?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Interactions Over Time">
                  <Column
                    data={summary.notesByDate}
                    xField="date"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: { autoRotate: true, formatter: formatBucketLabel },
                    }}
                    yAxis={{ title: { text: 'Interactions' } }}
                    style={{ fill: CHART_COLORS.primary }}
                  />
                </ChartCard>
              </Col>
            )}

            {(summary.uniqueClientsByDate?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Unique Clients Over Time">
                  <Column
                    data={summary.uniqueClientsByDate}
                    xField="date"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: { autoRotate: true, formatter: formatBucketLabel },
                    }}
                    yAxis={{ title: { text: 'Clients' } }}
                    style={{ fill: CHART_COLORS.purple }}
                  />
                </ChartCard>
              </Col>
            )}

            {(summary.notesByTeam?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Interactions by Team">
                  <Column
                    data={summary.notesByTeam}
                    xField="name"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: { autoRotate: true, style: { fontSize: 11 } },
                    }}
                    yAxis={{ title: { text: 'Count' } }}
                    style={{ fill: CHART_COLORS.primary }}
                  />
                </ChartCard>
              </Col>
            )}

            {(summary.notesByPurpose?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Top Purposes">
                  {/* A donut of one category is a ring that says only "100%", and the
                      legend, the outside label and the ring all repeat the same word. A
                      single line states it once. */}
                  {summary.notesByPurpose.length === 1 ? (
                    <div className="flex h-[300px] flex-col items-center justify-center gap-1">
                      <span className="text-2xl font-semibold text-neutral-800">
                        {summary.notesByPurpose[0].count.toLocaleString()}
                      </span>
                      <span className="text-sm text-neutral-500">
                        interactions, all with purpose{' '}
                        <span className="font-medium text-neutral-700">
                          {summary.notesByPurpose[0].name}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <Pie
                      data={summary.notesByPurpose}
                      angleField="count"
                      colorField="name"
                      // Multi-series: the categorical palette is the right answer here, and
                      // `style.fill` would flatten every slice to one colour.
                      height={300}
                      radius={0.8}
                      innerRadius={0.5}
                      label={{ text: 'name', position: 'outside' }}
                      legend={{ position: 'bottom' }}
                    />
                  )}
                </ChartCard>
              </Col>
            )}

            {(summary.topProvidedServices?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Top Provided Services">
                  <Column
                    data={summary.topProvidedServices}
                    xField="name"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: { autoRotate: true, style: { fontSize: 10 } },
                    }}
                    yAxis={{ title: { text: 'Count' } }}
                    style={{ fill: CHART_COLORS.success }}
                  />
                </ChartCard>
              </Col>
            )}

            {(summary.topRequestedServices?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Top Requested Services">
                  <Column
                    data={summary.topRequestedServices}
                    xField="name"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: { autoRotate: true, style: { fontSize: 10 } },
                    }}
                    yAxis={{ title: { text: 'Count' } }}
                    style={{ fill: CHART_COLORS.warning }}
                  />
                </ChartCard>
              </Col>
            )}
          </Row>

          {/* Geographic breakdown. Reuses the page's own date range and org so the
              region figures always match the KPIs above them. */}
          {activeOrg && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <LocationBreakdown
                  organizationId={activeOrg.id}
                  startDate={startStr}
                  endDate={endStr}
                  hasMapsKey={hasMapsKey}
                />
              </Col>
            </Row>
          )}

          {summary.totalNotes === 0 && (
            <Card>
              <p className="text-center text-neutral-500">
                No interaction data found for the selected date range.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
