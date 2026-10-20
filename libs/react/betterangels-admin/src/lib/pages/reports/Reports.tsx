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
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useActiveOrg } from '@monorepo/ba-platform';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { toDateString } from '@monorepo/shared/scalars';
import { mergeCss } from '@monorepo/react/shared';
import { ChartCard } from '../../components';
import { useCSVDownload } from '../../hooks';
import { formatBucketLabel } from './formatBucketLabel';
import {
  useInteractionsByRegion,
  useRegionDimensions,
  useReportSummary,
  type ReportSummaryType,
} from './hooks';
import { LocationBreakdown } from './LocationBreakdown';
import { GENERIC_ERROR_MESSAGE } from './reportErrors';
import { kindLabelPlural, regionBreakdownView } from './regionBreakdown';
import { ReportGroupControls } from './ReportGroupControls';

const { RangePicker } = DatePicker;
const { Text } = Typography;

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
 * One headline number with a single-line caption, so the four cards share a height.
 *
 * A zero that means "measured zero" is shown as a dash only when the rest of the page has
 * data; the caption carries the reason in one truncated line rather than wrapping the card.
 */
function Kpi({
  title,
  value,
  caption,
  empty = false,
}: {
  title: string;
  value: number;
  caption: string;
  empty?: boolean;
}) {
  return (
    <div className="flex min-h-[92px] flex-col justify-between">
      {empty ? (
        <Statistic
          title={title}
          value="—"
          valueRender={(node) => (
            <span className="text-neutral-400">{node}</span>
          )}
        />
      ) : (
        <Statistic title={title} value={value} />
      )}
      <span
        className="mt-2 block truncate text-xs text-neutral-500"
        title={caption}
      >
        {caption}
      </span>
    </div>
  );
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
  // The page's group. Codes are cleared with the dimension (see `handleDimensionChange`).
  const [dimension, setDimension] = useState<RegionDimension | undefined>(
    undefined,
  );
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
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

  // One selection for the summary, the picker/table rollup and the map.
  const {
    dimensions,
    loading: dimensionsLoading,
    error: dimensionsError,
  } = useRegionDimensions();
  const {
    rows: availableRegions,
    loading: rowsLoading,
    error: rowsError,
  } = useInteractionsByRegion({
    organizationId,
    dimension,
    startDate: startStr,
    endDate: endStr,
  });

  const { summary, loading, error } = useReportSummary({
    organizationId,
    startDate: startStr,
    endDate: endStr,
    dimension,
    regionCodes: selectedCodes,
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
    if (dimensionsError) {
      console.error(dimensionsError);
    }
    if (rowsError) {
      console.error(rowsError);
    }
  }, [downloadError, error, dimensionsError, rowsError]);

  const orgName = activeOrg?.name ?? 'Your Organization';

  // The rollup's drill-down, derived locally so the subtitle can name the selection.
  const breakdown = useMemo(
    () => regionBreakdownView(availableRegions, selectedCodes),
    [availableRegions, selectedCodes],
  );

  let groupLabel: string | undefined;
  if (dimension !== undefined) {
    const plural = kindLabelPlural(dimension, dimensions);
    // Fall back to codes until the rollup can name the selection.
    groupLabel =
      selectedCodes.length > 0
        ? `${plural}: ${breakdown.filteredToName ?? selectedCodes.join(', ')}`
        : `All ${plural.toLowerCase()}`;
  }

  const panelError = dimensionsError ?? rowsError;

  const handleDimensionChange = (next?: RegionDimension) => {
    setDimension(next);
    // Codes are dimension-specific; clear them in the same batch.
    setSelectedCodes((codes) => (codes.length === 0 ? codes : []));
    clearError();
  };

  const handleCodesChange = (codes: string[]) => {
    setSelectedCodes(codes);
    clearError();
  };

  const handleResetGroup = () => {
    setDimension(undefined);
    setSelectedCodes([]);
    clearError();
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates?.[1]) {
      setDateRange([dates[0], dates[1]]);
      clearError();
    }
  };

  const handleDownload = () =>
    download(startStr, endStr, activeOrg?.id, {
      dimension,
      codes: selectedCodes,
    });

  // `topProvidedServices` is capped at 15 by the backend (`reports.selectors.note_top_services`),
  // so this sum is the interactions attributed to the 15 most provided services — not a total
  // over every service, which the summary does not carry. The label states the cap rather than
  // claiming a total the number cannot support.
  const topProvidedServicesTotal =
    summary?.topProvidedServices?.reduce(
      (sum, row) => sum + (row.count ?? 0),
      0,
    ) ?? 0;

  // Only the charts with data; the grid reflows around whatever is left, so a quiet group does
  // not leave an empty half-row.
  const charts: { key: string; title: string; body: ReactNode }[] = [];
  if (summary) {
    if ((summary.notesByDate?.length ?? 0) > 0) {
      charts.push({
        key: 'date',
        title: 'Interactions Over Time',
        body: (
          <Column
            data={summary.notesByDate}
            xField="date"
            yField="count"
            height={300}
            axis={AXIS_DATES_INTERACTIONS}
            style={CHART_STYLE.primary}
          />
        ),
      });
    }
    if ((summary.uniqueClientsByDate?.length ?? 0) > 0) {
      charts.push({
        key: 'clients-date',
        title: 'Unique Clients Over Time',
        body: (
          <Column
            data={summary.uniqueClientsByDate}
            xField="date"
            yField="count"
            height={300}
            axis={AXIS_DATES_CLIENTS}
            style={CHART_STYLE.purple}
          />
        ),
      });
    }
    if ((summary.notesByTeam?.length ?? 0) > 0) {
      charts.push({
        key: 'team',
        title: 'Interactions by Team',
        body: (
          <Column
            data={summary.notesByTeam}
            xField="name"
            yField="count"
            height={300}
            axis={AXIS_NAMES_COUNT}
            style={CHART_STYLE.primary}
          />
        ),
      });
    }
    if ((summary.notesByPurpose?.length ?? 0) > 0) {
      charts.push({
        key: 'purpose',
        title: 'Top Purposes',
        body: <PurposeChart purposes={summary.notesByPurpose} />,
      });
    }
    if ((summary.topProvidedServices?.length ?? 0) > 0) {
      charts.push({
        key: 'provided',
        title: 'Top Provided Services',
        body: (
          <Column
            data={summary.topProvidedServices}
            xField="name"
            yField="count"
            height={300}
            axis={AXIS_NAMES_COUNT}
            style={CHART_STYLE.success}
          />
        ),
      });
    }
    if ((summary.topRequestedServices?.length ?? 0) > 0) {
      charts.push({
        key: 'requested',
        title: 'Top Requested Services',
        body: (
          <Column
            data={summary.topRequestedServices}
            xField="name"
            yField="count"
            height={300}
            axis={AXIS_NAMES_COUNT}
            style={CHART_STYLE.warning}
          />
        ),
      });
    }
  }

  return (
    <div className={mergeCss(['flex flex-col gap-6', className])}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Interaction data for {orgName}
            {groupLabel ? ` · ${groupLabel}` : ''}
          </p>
        </div>
        <Button
          type="primary"
          icon={<DownloadIcon isDownloading={isDownloading} />}
          loading={isDownloading}
          onClick={handleDownload}
        >
          Download CSV
        </Button>
      </div>

      {/* One compact toolbar: the group scopes everything below, the date range is the window,
          and Reset clears the group. No card, no helper copy. */}
      <div className="flex flex-wrap items-end gap-3 border-b border-neutral-200 pb-4">
        <ReportGroupControls
          dimensions={dimensions}
          dimensionsLoading={dimensionsLoading}
          dimensionsError={dimensionsError}
          dimension={dimension}
          selectedCodes={selectedCodes}
          rows={availableRegions}
          rowsLoading={rowsLoading}
          onDimensionChange={handleDimensionChange}
          onSelectedCodesChange={handleCodesChange}
        />

        <div className="flex flex-col gap-1">
          <Text type="secondary">Date range</Text>
          <RangePicker
            value={dateRange}
            onChange={handleRangeChange}
            format="YYYY-MM-DD"
            allowClear={false}
          />
        </div>

        <Button
          type="text"
          disabled={dimension === undefined && selectedCodes.length === 0}
          onClick={handleResetGroup}
        >
          Reset
        </Button>
      </div>

      {downloadError && (
        <Alert
          type="error"
          showIcon
          message={GENERIC_ERROR_MESSAGE}
          closable
          onClose={clearError}
        />
      )}

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
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Kpi
                    title={
                      dimension === undefined
                        ? 'Total Interactions'
                        : 'Interactions in Group'
                    }
                    value={summary.totalNotes}
                    caption={
                      dimension === undefined
                        ? 'In the selected date range'
                        : 'Inside the selected group'
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Kpi
                    title="Unique Clients"
                    value={summary.uniqueClients}
                    empty={
                      summary.uniqueClients === 0 && summary.totalNotes > 0
                    }
                    caption={
                      summary.totalNotes === 0
                        ? 'No interactions in range'
                        : summary.uniqueClients === 0
                          ? 'No clients recorded'
                          : 'Distinct clients in range'
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Kpi
                    title="Active Teams"
                    value={summary.notesByTeam?.length ?? 0}
                    empty={
                      (summary.notesByTeam?.length ?? 0) === 0 &&
                      summary.totalNotes > 0
                    }
                    caption={
                      summary.totalNotes === 0
                        ? 'No interactions in range'
                        : (summary.notesByTeam?.length ?? 0) === 0
                          ? 'No team recorded'
                          : 'Teams with interactions'
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Card>
                  <Kpi
                    title="Top 15 Provided Services"
                    value={topProvidedServicesTotal}
                    caption={
                      topProvidedServicesTotal === 0
                        ? 'No services recorded'
                        : 'Across the top 15 services'
                    }
                  />
                </Card>
              </Col>
            </Row>

            {/* Charts. Auto-fit: one chart fills the row, two or more tile without a hole. */}
            {charts.length > 0 && (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
                }}
              >
                {charts.map(({ key, title, body }) => (
                  <ChartCard key={key} title={title}>
                    {body}
                  </ChartCard>
                ))}
              </div>
            )}

            {/* Reuses the page's date range, org and group. */}
            {activeOrg && (
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <LocationBreakdown
                    organizationId={activeOrg.id}
                    startDate={startStr}
                    endDate={endStr}
                    dimension={dimension}
                    selectedCodes={selectedCodes}
                    dimensions={dimensions}
                    rows={availableRegions}
                    rowsLoading={rowsLoading}
                    panelError={panelError}
                    hasMapsKey={hasMapsKey}
                  />
                </Col>
              </Row>
            )}

            {summary.totalNotes === 0 && (
              <Card>
                <p className="text-center text-neutral-500">
                  {dimension === undefined
                    ? 'No interaction data found for the selected date range.'
                    : 'No interaction data found for the selected date range and group.'}
                </p>
              </Card>
            )}
          </div>
        </Spin>
      )}
    </div>
  );
}
