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
  Spin,
  Statistic,
  theme,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useActiveOrg } from '@monorepo/ba-platform';
import { toDateString } from '@monorepo/shared/scalars';
import { mergeCss } from '@monorepo/react/shared';
import { ChartCard } from '../../components';
import { useCSVDownload } from '../../hooks';
import { formatBucketLabel } from './formatBucketLabel';
import { useReportSummary, type ReportSummaryType } from './hooks';
import { LocationBreakdown } from './LocationBreakdown';
import { GENERIC_ERROR_MESSAGE } from './reportErrors';

const { RangePicker } = DatePicker;

type IProps = {
  className?: string;
  hasMapsKey?: boolean;
};

function getDefaultRange(): [Dayjs, Dayjs] {
  const now = dayjs();
  const start = now.subtract(1, 'month').startOf('month');
  const end = now.subtract(1, 'month').endOf('month');
  return [start, end];
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
        // The dash is only meaningful with the reason attached, and both read as secondary.
        // The colour has to sit on these nodes rather than on the root: `Statistic` sets `color`
        // on its own title and content elements, and a colour inherited from the root loses to
        // a declaration on the element itself.
        valueRender={(node) => <span className="text-neutral-400">{node}</span>}
        suffix={<span className="text-xs font-normal text-neutral-400">{emptyHint}</span>}
      />
    );
  }
  return <Statistic title={title} value={value} />;
}

/**
 * The purposes chart, in one of two shapes.
 *
 * A donut of one category is a ring that says only "100%", and the legend, the outside label
 * and the ring all repeat the same word. A single line states it once. Split into its own
 * component rather than a ternary in the JSX: both branches are whole elements, which is past
 * the point the styleguide asks for a guard.
 */
function PurposeChart({
  purposes,
}: {
  purposes: ReportSummaryType['notesByPurpose'];
}) {
  if (purposes.length === 1) {
    const only = purposes[0];
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-1">
        <span className="text-2xl font-semibold text-neutral-800">
          {only.count.toLocaleString()}
        </span>
        <span className="text-sm text-neutral-500">
          interactions, all with purpose{' '}
          <span className="font-medium text-neutral-700">{only.name}</span>
        </span>
      </div>
    );
  }
  return (
    <Pie
      data={purposes}
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
  );
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
 * default blue regardless — so the fill has to be passed where the mark reads it.
 *
 * Read through `useToken` rather than importing hexes, so a theme change flows through, and the
 * palette stays the product's rather than a set of values chosen once against an older theme.
 */
function useChartColors() {
  const { token } = theme.useToken();
  // Memoised: `@ant-design/charts` re-initialises when a prop's *identity* changes, and a
  // fresh object literal on every render made all five charts re-init on every keystroke,
  // loading flip and date change — which is what made switching datasets feel jerky.
  return useMemo(
    () => ({
      primary: token.colorPrimary,
      success: token.colorSuccess,
      warning: token.colorWarning,
      purple: token.colorInfo,
    }),
    [
      token.colorPrimary,
      token.colorSuccess,
      token.colorWarning,
      token.colorInfo,
    ],
  );
}

/**
 * Axis config, hoisted so a re-render does not hand the chart a new object and re-init it.
 *
 * **`axis={{ x, y }}`, not `xAxis`/`yAxis`.** `@antv/g2`'s mark spec has no `xAxis`/`yAxis`
 * member (only `axis`), and `@ant-design/plots`' option map — the same table that turns
 * `colorField` into `encode.color` — has no mapping for either name. Confirmed by grep: neither
 * string occurs anywhere in `@ant-design/plots/es` or `@antv/g2/lib`, so the v1 names are dead
 * and an axis passed that way never reaches the chart.
 *
 * `axis.x` / `axis.y` are positional channels, so they stay correct when the chart's
 * orientation changes; the `countAxis` helper builds the shared "title only" number axis.
 */
const countAxis = (title: string) => ({ title: { text: title } });
const Y_AXIS_INTERACTIONS = countAxis('Interactions');
const Y_AXIS_CLIENTS = countAxis('Clients');
const Y_AXIS_COUNT = countAxis('Count');
const X_AXIS_DATES = {
  label: { autoRotate: true, formatter: formatBucketLabel },
};
const X_AXIS_NAMES = { label: { autoRotate: true, style: { fontSize: 11 } } };
/** `Column`/`Pie` take the pair as one prop; `axis.x`/`axis.y` match `xField`/`yField`. */
const axisFor = (x: object, y: object) => ({ x, y });

/** The three pairings the page uses, hoisted so the objects stay referentially stable. */
const AXIS_DATES_INTERACTIONS = axisFor(X_AXIS_DATES, Y_AXIS_INTERACTIONS);
const AXIS_DATES_CLIENTS = axisFor(X_AXIS_DATES, Y_AXIS_CLIENTS);
const AXIS_NAMES_COUNT = axisFor(X_AXIS_NAMES, Y_AXIS_COUNT);

export function Reports({ className = '', hasMapsKey = true }: IProps) {
  const CHART_COLORS = useChartColors();
  // The fill objects too: `style={{ fill }}` inline was a new object on every render, which
  // re-initialised the chart just as the colours did.
  const CHART_STYLE = useMemo(
    () => ({
      primary: { fill: CHART_COLORS.primary },
      purple: { fill: CHART_COLORS.purple },
      success: { fill: CHART_COLORS.success },
      warning: { fill: CHART_COLORS.warning },
    }),
    [CHART_COLORS],
  );
  const { activeOrg } = useActiveOrg();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(getDefaultRange);
  const {
    download,
    isDownloading,
    error: downloadError,
    clearError,
  } = useCSVDownload();

  const [startDate, endDate] = dateRange;
  // `YYYY-MM-DD` is the `Date` scalar's wire format. Named for what it produces rather than
  // recycling the shared `formatScalarDate`, which takes a *scalar string* and returns a
  // *display* string — the opposite direction.
  const startStr = toDateString(startDate.toDate());
  const endStr = toDateString(endDate.toDate());

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

  // `topProvidedServices` is capped at 15 by the backend (`reports.selectors.note_top_services`),
  // so this sum is the interactions attributed to the 15 most provided services — not a total
  // over every service, which the summary does not carry. The label states the cap rather than
  // claiming a total the number cannot support.
  const topProvidedServicesTotal =
    summary?.topProvidedServices?.reduce((sum, row) => sum + (row.count ?? 0), 0) ??
    0;

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

      {/* Skeletons **only for the first load**, which is the only time there is nothing to
          show. They are a different height from the real content, so swapping them in on every
          refetch replaces every card — the map panel included — with placeholder shapes and
          the page loses enough height for the browser to clamp the reader's scroll position.
          Once there is a summary, the refetch is shown as a busy overlay over it instead, which
          keeps the layout and the map exactly where they were. */}
      {loading && !summary && (
        <div className="flex flex-col gap-4">
          <Row gutter={[16, 16]}>
            {[0, 1, 2, 3].map((i) => (
              <Col key={i} xs={24} sm={6}>
                <Card>
                  <Skeleton
                    active
                    paragraph={{ rows: 1 }}
                    title={{ width: '60%' }}
                  />
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

      {summary && (
        <Spin spinning={loading}>
          {/* The gap has to be re-declared here: `Spin` inserts its own block wrappers between
              the page's flex column and these rows, so the parent's `gap-6` no longer reaches
              them and the cards would otherwise touch. */}
          <div className="flex flex-col gap-6">
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
                <Statistic
                  title="Top 15 Provided Services"
                  value={topProvidedServicesTotal}
                />
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
                    axis={AXIS_DATES_INTERACTIONS}
                    style={CHART_STYLE.primary}
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
                    axis={AXIS_DATES_CLIENTS}
                    style={CHART_STYLE.purple}
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
                    axis={AXIS_NAMES_COUNT}
                    style={CHART_STYLE.primary}
                  />
                </ChartCard>
              </Col>
            )}

            {(summary.notesByPurpose?.length ?? 0) > 0 && (
              <Col xs={24} lg={12}>
                <ChartCard title="Top Purposes">
                  <PurposeChart purposes={summary.notesByPurpose} />
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
                    axis={AXIS_NAMES_COUNT}
                    style={CHART_STYLE.success}
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
                    axis={AXIS_NAMES_COUNT}
                    style={CHART_STYLE.warning}
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
          </div>
        </Spin>
      )}
    </div>
  );
}
