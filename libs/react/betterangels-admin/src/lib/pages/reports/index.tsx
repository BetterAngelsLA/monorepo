import { Column, Pie } from '@ant-design/charts';
import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Spin,
  Statistic,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { ChartCard } from '../../components';
import { useCSVDownload } from '../../hooks';
import { useApiConfig, useUser } from '../../providers';
import { ReportSummaryDocument } from './__generated__/reports.generated';

const { RangePicker } = DatePicker;

type IProps = {
  className?: string;
};

function getDefaultRange(): [Dayjs, Dayjs] {
  const now = dayjs();
  const start = now.subtract(1, 'month').startOf('month');
  const end = now.subtract(1, 'month').endOf('month');
  return [start, end];
}

function formatDate(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

const CHART_COLORS = {
  primary: '#1B3A5C',
  success: '#2E7D32',
  warning: '#E65100',
} as const;

export default function Reports({ className = '' }: IProps) {
  const { fetchClient } = useApiConfig();
  const { user } = useUser();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getDefaultRange);
  const { download, isDownloading, error, clearError } =
    useCSVDownload(fetchClient);

  const [startDate, endDate] = dateRange;
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const { data, loading } = useQuery(ReportSummaryDocument, {
    variables: { startDate: startStr, endDate: endStr },
  });
  const summary = data?.reportSummary ?? null;

  const orgName = user?.organizations?.[0]?.name ?? 'Your Organization';

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates?.[1]) {
      setDateRange([dates[0], dates[1]]);
      clearError();
    }
  };

  const handleDownload = () => download(startStr, endStr);

  const totalServices =
    summary?.topProvidedServices.reduce((s, x) => s + x.count, 0) ?? 0;

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
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
            icon={isDownloading ? <LoadingOutlined /> : <DownloadOutlined />}
            loading={isDownloading}
            onClick={handleDownload}
          >
            Download CSV
          </Button>
        </div>
        {error && (
          <Alert
            className="mt-4"
            type="error"
            message={error}
            closable
            onClose={clearError}
          />
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spin size="small" /> Loading report data...
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
                <Statistic
                  title="Unique Clients"
                  value={summary.uniqueClients}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Active Teams"
                  value={summary.notesByTeam.length}
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
            {summary.notesByDate.length > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Interactions Over Time">
                  <Column
                    data={summary.notesByDate}
                    xField="date"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: {
                        autoRotate: true,
                        formatter: (v: string) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        },
                      },
                    }}
                    yAxis={{ title: { text: 'Interactions' } }}
                    color={CHART_COLORS.primary}
                  />
                </ChartCard>
              </Col>
            )}

            {summary.uniqueClientsByDate.length > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Unique Clients Over Time">
                  <Column
                    data={summary.uniqueClientsByDate}
                    xField="date"
                    yField="count"
                    height={300}
                    xAxis={{
                      label: {
                        autoRotate: true,
                        formatter: (v: string) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        },
                      },
                    }}
                    yAxis={{ title: { text: 'Clients' } }}
                    color="#6A1B9A"
                  />
                </ChartCard>
              </Col>
            )}

            {summary.notesByTeam.length > 0 && (
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
                    color={CHART_COLORS.primary}
                  />
                </ChartCard>
              </Col>
            )}

            {summary.notesByPurpose.length > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Top Purposes">
                  <Pie
                    data={summary.notesByPurpose}
                    angleField="count"
                    colorField="name"
                    height={300}
                    radius={0.8}
                    innerRadius={0.5}
                    label={{ text: 'name', position: 'outside' }}
                    legend={{ position: 'bottom' }}
                  />
                </ChartCard>
              </Col>
            )}

            {summary.topProvidedServices.length > 0 && (
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
                    color={CHART_COLORS.success}
                  />
                </ChartCard>
              </Col>
            )}

            {summary.topRequestedServices.length > 0 && (
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
                    color={CHART_COLORS.warning}
                  />
                </ChartCard>
              </Col>
            )}
          </Row>

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
