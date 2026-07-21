import { BarChart, type ViewMode } from '../BarChart/BarChart';

/**
 * Mirrors the backend DailyBedStatusMetricsType. Replace with the generated
 * GraphQL type once the reporting query is wired up.
 */
export type DailyBedStatusMetricsType = {
  date: string;
  occupied: number;
  available: number;
  reserved: number;
  out_of_service: number;
  in_turnaround: number;
};

/** Pivot one row-per-day into one row-per-(day × status) for the stacked bar chart. */
function toBedStatusCountData(metrics: DailyBedStatusMetricsType[]) {
  return metrics.flatMap((d) => [
    { date: d.date, status: 'Occupied', count: d.occupied },
    { date: d.date, status: 'Available', count: d.available },
    { date: d.date, status: 'Reserved', count: d.reserved },
    { date: d.date, status: 'Out of Service', count: d.out_of_service },
  ]);
}

/** Same pivot but each count is expressed as a percentage of the daily total. */
function toBedStatusPercentData(metrics: DailyBedStatusMetricsType[]) {
  return metrics.flatMap((d) => {
    const total = d.occupied + d.available + d.reserved + d.out_of_service;
    const pct = (n: number) => {
      if (!total) return 0;
      return Math.round((n / total) * 1000) / 10;
    };
    return [
      { date: d.date, status: 'Occupied', count: pct(d.occupied) },
      { date: d.date, status: 'Available', count: pct(d.available) },
      { date: d.date, status: 'Reserved', count: pct(d.reserved) },
      { date: d.date, status: 'Out of Service', count: pct(d.out_of_service) },
    ];
  });
}

const cardClassName =
  'rounded-[20px] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.06)]';
// BarChart uses autoFit, so the card needs an explicit height for the plot to fill.
const chartCardClassName = `flex flex-col ${cardClassName} h-[560px]`;

// TODO(data-wiring): replace this sample data with real ShelterOccupancyMetrics
// once the reporting query lands. Deterministic so the layout renders stably.
const DAYS = Array.from({ length: 28 }, (_, i) => `Jun ${i + 1}`);

const STATUSES = ['Occupied', 'Available', 'Reserved', 'Out of Service'];
const STATUS_COLORS = ['#008CEE', '#05B428', '#FF7B00', '#F64949'];

const bedStatusData = DAYS.flatMap((date, i) => [
  { date, status: 'Occupied', count: 12 + (i % 6) },
  { date, status: 'Available', count: 8 + (i % 4) },
  { date, status: 'Reserved', count: 10 - (i % 3) },
  { date, status: 'Out of Service', count: 5 + (i % 3) },
]);

const bedStatusPercentageData = DAYS.flatMap((date, i) => [
  { date, status: 'Occupied', count: 28 + (i % 5) },
  { date, status: 'Available', count: 18 + (i % 4) },
  { date, status: 'Reserved', count: 20 - (i % 3) },
  { date, status: 'Out of Service', count: 12 - (i % 4) },
]);

const dailyOccupancyData = DAYS.map((date, i) => ({
  date,
  count: 45 + Math.round(Math.sin(i * 0.4) * 12),
}));

const dailyOccupancyPercentageData = DAYS.map((date, i) => ({
  date,
  count: Math.min(100, Math.max(0, 60 + Math.round(Math.sin(i * 0.4) * 20))),
}));

/**
 * "Bed Status" report chart — stacked bars of bed statuses per day. BarChart
 * (#2162) owns the title, the Count/Percentage toggle, and the legend.
 *
 * Pass `data` once the reporting query is wired up; falls back to sample data
 * so the layout renders stably in the meantime.
 */
export function BedStatusChart({
  data,
}: {
  data?: DailyBedStatusMetricsType[];
}) {
  let countData = bedStatusData;
  let percentData = bedStatusPercentageData;
  if (data) {
    countData = toBedStatusCountData(data);
    percentData = toBedStatusPercentData(data);
  }

  return (
    <section className={chartCardClassName} data-testid="bed-status-chart">
      <BarChart
        chartTitle="Bed Status"
        showViewToggle
        onViewChange={(mode: ViewMode) =>
          mode === 'percentage'
            ? {
                data: percentData,
                axis: { y: { title: 'Status by %', tickCount: 6 } },
                scale: { y: { nice: false, domain: [0, 100] } },
              }
            : {}
        }
        data={countData}
        xField="date"
        yField="count"
        colorField="status"
        stack
        axis={{
          x: { title: 'Date' },
          y: { title: 'Status by Count', tickCount: 6 },
        }}
        scale={{
          color: { domain: STATUSES, range: STATUS_COLORS },
          x: { padding: 0.4 },
          y: { nice: true },
        }}
        style={{ stroke: '#ffffff', lineWidth: 1, inset: 0.1 }}
        tooltip={{ title: 'date' }}
        className="h-full"
      />
    </section>
  );
}

/**
 * "Daily Occupancy" report chart — single-series bars of occupancy per day.
 * BarChart (#2162) owns the title and the Count/Percentage toggle.
 */
export function DailyOccupancyChart() {
  return (
    <section className={chartCardClassName} data-testid="daily-occupancy-chart">
      <BarChart
        chartTitle="Daily Occupancy"
        showViewToggle
        onViewChange={(mode: ViewMode) =>
          mode === 'percentage'
            ? {
                data: dailyOccupancyPercentageData,
                axis: { y: { title: 'Occupancy by %', tickCount: 6 } },
                scale: { y: { nice: false, domain: [0, 100] } },
              }
            : {}
        }
        data={dailyOccupancyData}
        xField="date"
        yField="count"
        axis={{
          x: { title: 'Date' },
          y: { title: 'Number of Beds Occupied', tickCount: 6 },
        }}
        scale={{ x: { padding: 0.4 }, y: { nice: true } }}
        style={{ fill: '#008CEE' }}
        tooltip={{ title: 'date' }}
        className="h-full"
      />
    </section>
  );
}
