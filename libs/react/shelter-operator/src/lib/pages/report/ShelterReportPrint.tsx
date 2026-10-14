import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { format } from 'date-fns';
import type { ReactNode, Ref } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BedStatusChart,
  DailyOccupancyChart,
} from '../../components/reports/ReportCharts';
import type { ExportMetric } from '../../components/reports/useShelterMetricsExport';
import { Text } from '../../components/base-ui/text/text';
import type {
  DailyBedStatusMetrics,
  DailyOccupancyMetrics,
  ReservationMetrics,
} from '../../hooks/useShelterOccupancyMetrics';
import { ReportOperationalStats } from './ReportOperationalStats';

// US Letter, portrait, at 96dpi (8.5in x 11in). Fixed so each page's raster
// capture is identical regardless of the browser window that generated it.
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const PAGE_PADDING = 48;

/**
 * Vertical space a page has for content: the fixed page box minus its padding,
 * minus the header block. Measured against `ReportPageHeader`, and kept
 * deliberately conservative (tallest variant) so a section never straddles the
 * edge of the captured box — html2canvas sizes its canvas from the element's
 * own box, so anything past `PAGE_HEIGHT` would be silently dropped.
 */
const HEADER_RESERVE = 96;
const CONTENT_GAP = 24;
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2 - HEADER_RESERVE;

// Matches the stat tray's grey background instead of the live dashboard's
// white shadowed chart card.
const CHART_CONTAINER_CLASSNAME = 'bg-[#F9F9F9] shadow-none';

export interface IShelterReportPrintCounts {
  available: number;
  inTurnaround: number;
  occupied: number;
  outOfService: number;
  reserved: number;
  total: number;
}

export interface IShelterReportPrintProps {
  shelterName?: string;
  shelterAddress?: string;
  organizationName?: string;
  /** Current-state counts, shown alongside the reporting-period metrics. */
  bedCounts?: IShelterReportPrintCounts | null;
  roomCounts?: IShelterReportPrintCounts | null;
  range: { from: Date; to: Date };
  generatedAt: Date;
  includedMetrics: ExportMetric[];
  metrics?: ReservationMetrics | null;
  avgDaysToOccupancy?: number | null;
  dailyBedStatus?: DailyBedStatusMetrics[];
  dailyOccupancy?: DailyOccupancyMetrics[];
  ref?: Ref<HTMLDivElement>;
}

interface IReportPageProps {
  pageNumber: number;
  totalPages: number;
  header: ReactNode;
  children: ReactNode;
}

/** One physical printed page: fixed Letter size, repeated footer (logo + page number). */
function ReportPage({
  pageNumber,
  totalPages,
  header,
  children,
}: IReportPageProps) {
  return (
    <div
      data-report-page="true"
      className="report-page relative flex flex-col bg-white"
      style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: PAGE_PADDING }}
    >
      {header}

      <div
        className="flex flex-col"
        style={{ gap: CONTENT_GAP, marginTop: CONTENT_GAP }}
      >
        {children}
      </div>

      <div className="absolute bottom-6 left-12 right-12 flex items-center justify-between">
        <BetterAngelsLogoIcon fill="#D1D5DB" className="h-4 w-auto" />
        <Text variant="body" textColor="text-[#9CA3AF]" className="text-[13px]">
          {pageNumber} of {totalPages}
        </Text>
      </div>
    </div>
  );
}

interface IReportPageHeaderProps {
  variant: 'primary' | 'compact';
  shelterName?: string;
  shelterAddress?: string;
  range: { from: Date; to: Date };
  generatedAt: Date;
}

function ReportPageHeader({
  variant,
  shelterName,
  shelterAddress,
  range,
  generatedAt,
}: IReportPageHeaderProps) {
  const rangeText = `${format(range.from, 'MM/dd/yyyy')} – ${format(range.to, 'MM/dd/yyyy')}`;
  const exportedText = `${format(generatedAt, 'MM/dd/yyyy')} at ${format(generatedAt, 'h:mm a')}`;

  return (
    <div className="flex flex-shrink-0 items-start justify-between border-b border-[#E5E7EB] pb-4">
      <div>
        {variant === 'primary' ? (
          <>
            <Text
              variant="header-md"
              className="block leading-none text-[#111827]"
            >
              Operational Summary
            </Text>
            <Text variant="body" className="mt-2 block text-[#6B7280]">
              {shelterName ?? 'Shelter Name'}
              {shelterAddress ? ` [${shelterAddress}]` : ''}
            </Text>
          </>
        ) : (
          <>
            <Text
              variant="header-md"
              className="block leading-none text-[#111827]"
            >
              {shelterName ?? 'Shelter Name'}
            </Text>
            {shelterAddress && (
              <Text variant="body" className="mt-2 block text-[#6B7280]">
                {shelterAddress}
              </Text>
            )}
          </>
        )}
      </div>

      <div className="text-right">
        <Text variant="body" className="block text-[13px] text-[#9CA3AF]">
          {variant === 'primary' && (
            <span className="text-[#9CA3AF]">Reporting Period </span>
          )}
          <span className="font-medium text-[#111827]">{rangeText}</span>
        </Text>
        <Text variant="body" className="mt-1 block text-[13px] text-[#9CA3AF]">
          <span className="text-[#9CA3AF]">Exported </span>
          <span className="font-medium text-[#111827]">{exportedText}</span>
        </Text>
      </div>
    </div>
  );
}

const cardClassName =
  'rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-none';

/** Bed and room counts share a shape, so both render the same rows. */
const COUNT_ROWS = [
  { key: 'total', label: 'Total' },
  { key: 'available', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'inTurnaround', label: 'In Turnaround' },
  { key: 'outOfService', label: 'Out of Service' },
] as const;

function CountsSection({
  title,
  counts,
  organizationName,
}: {
  title: string;
  counts: IShelterReportPrintCounts;
  organizationName?: string;
}) {
  return (
    <section className={cardClassName}>
      {/* h2, not h3: the page title is a span, so the first heading on the page
          must not start at level 3. */}
      <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-x-8">
        {COUNT_ROWS.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-[#F3F4F6] py-2 text-sm"
          >
            <span className="text-[#6B7280]">{label}</span>
            <span className="font-medium text-[#111827]">{counts[key]}</span>
          </div>
        ))}
      </div>
      {organizationName && (
        <Text variant="body" className="mt-3 block text-[13px] text-[#6B7280]">
          Organization: {organizationName}
        </Text>
      )}
    </section>
  );
}

/**
 * Presentational, chrome-less multi-page report captured by html2canvas-pro
 * (see useExportPdf.ts) — one canvas per `.report-page` node, assembled into
 * a matching multi-page PDF, so section breaks land exactly where they do on
 * screen instead of an arbitrary pixel-height slice. Every page is a fixed
 * Letter size (see PAGE_WIDTH/PAGE_HEIGHT above) so the raster output is
 * identical regardless of the browser window that generated it.
 *
 * Sections are packed into pages from their measured heights rather than a
 * fixed guess, because a section that overflows its page box is outside the
 * element html2canvas rasterizes and would silently vanish from the PDF.
 */
export function ShelterReportPrint({
  shelterName,
  shelterAddress,
  organizationName,
  bedCounts,
  roomCounts,
  range,
  generatedAt,
  includedMetrics,
  metrics,
  avgDaysToOccupancy,
  dailyBedStatus,
  dailyOccupancy,
  ref,
}: IShelterReportPrintProps) {
  const showReservationStatusChanges = includedMetrics.includes(
    'reservation_metrics',
  );
  const showAvgDaysToOccupancy = includedMetrics.includes(
    'avg_days_to_occupancy',
  );
  const showStats = showReservationStatusChanges || showAvgDaysToOccupancy;
  const showBedStatus = includedMetrics.includes('daily_bed_status_metrics');
  const showDailyOccupancy = includedMetrics.includes(
    'daily_occupancy_metrics',
  );

  const headerProps = { shelterName, shelterAddress, range, generatedAt };

  const units = useMemo(() => {
    const list: { key: string; node: ReactNode }[] = [];

    if (bedCounts) {
      list.push({
        key: 'bed-counts',
        node: (
          <CountsSection
            title="Bed Summary"
            counts={bedCounts}
            organizationName={organizationName}
          />
        ),
      });
    }

    if (roomCounts) {
      list.push({
        key: 'room-counts',
        node: <CountsSection title="Room Summary" counts={roomCounts} />,
      });
    }

    if (showStats) {
      list.push({
        key: 'stats',
        node: (
          <ReportOperationalStats
            showReservationStatusChanges={showReservationStatusChanges}
            showAvgDaysToOccupancy={showAvgDaysToOccupancy}
            metrics={metrics}
            avgDaysToOccupancy={avgDaysToOccupancy}
          />
        ),
      });
    }

    if (showBedStatus) {
      list.push({
        key: 'bed-status',
        node: (
          <BedStatusChart
            data={dailyBedStatus}
            showViewToggle={false}
            forPrint
            containerClassName={CHART_CONTAINER_CLASSNAME}
          />
        ),
      });
    }

    if (showDailyOccupancy) {
      list.push({
        key: 'daily-occupancy',
        node: (
          <DailyOccupancyChart
            data={dailyOccupancy}
            showViewToggle={false}
            forPrint
            containerClassName={CHART_CONTAINER_CLASSNAME}
          />
        ),
      });
    }

    return list;
  }, [
    avgDaysToOccupancy,
    bedCounts,
    dailyBedStatus,
    dailyOccupancy,
    metrics,
    organizationName,
    roomCounts,
    showAvgDaysToOccupancy,
    showBedStatus,
    showDailyOccupancy,
    showReservationStatusChanges,
    showStats,
  ]);

  const rootRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<number[]>([]);

  // Only the units still missing a measurement are rendered off-canvas, so a
  // chart is never mounted twice once the layout has settled.
  const pendingKeys = units
    .filter((_, i) => heights[i] === undefined)
    .map((unit) => unit.key);

  // Measure each pending unit, then pack pages from the measurements. Runs
  // after every render so a metric change (or a late data arrival)
  // repaginates.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>('[data-report-unit]'),
    );
    if (nodes.length === 0) return;

    const byKey = new Map(
      nodes.map((node) => [
        node.getAttribute('data-report-unit') ?? '',
        node.getBoundingClientRect().height,
      ]),
    );

    setHeights((prev) => {
      const next = units.map((unit, i) => byKey.get(unit.key) ?? prev[i]);
      // Keep waiting until every unit has been measured once.
      if (next.some((h) => h === undefined)) return prev;

      const settled = next as number[];
      return prev.length === settled.length &&
        prev.every((h, i) => Math.abs(h - settled[i]) < 0.5)
        ? prev
        : settled;
    });
  }, [units]);

  const pages = useMemo(() => {
    if (units.length === 0) return [] as string[][];
    // Until measurements land, assume every unit needs its own page: that
    // over-paginates rather than dropping content, and the next layout pass
    // settles it before any capture happens.
    const measured = units.map((_, i) => heights[i] ?? PAGE_CONTENT_HEIGHT);

    const packed: string[][] = [];
    let current: string[] = [];
    let used = 0;

    units.forEach((unit, i) => {
      const needed = measured[i] + (current.length ? CONTENT_GAP : 0);
      if (current.length && used + needed > PAGE_CONTENT_HEIGHT) {
        packed.push(current);
        current = [];
        used = 0;
      }
      current.push(unit.key);
      used += measured[i] + (current.length > 1 ? CONTENT_GAP : 0);
    });
    if (current.length) packed.push(current);

    return packed;
  }, [heights, units]);

  const totalPages = Math.max(1, pages.length);
  const unitByKey = useMemo(
    () => new Map(units.map((unit) => [unit.key, unit.node])),
    [units],
  );

  // Merge the consumer's ref with ours so both the capture and the measurement
  // observe the same root node.
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref],
  );

  const compactHeader = <ReportPageHeader variant="compact" {...headerProps} />;

  return (
    <div
      ref={setRefs}
      className="flex flex-col items-center gap-6 bg-[#E5E7EB] p-10"
    >
      {/* Hidden measurement pass: same width and children as a real page, so
          the packed layout below is based on rendered heights. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[99999px] top-0 flex flex-col bg-white"
        style={{ width: PAGE_WIDTH - PAGE_PADDING * 2 }}
      >
        {units
          .filter((unit) => pendingKeys.includes(unit.key))
          .map((unit) => (
            <div key={unit.key} data-report-unit={unit.key}>
              {unit.node}
            </div>
          ))}
      </div>

      {pages.map((pageKeys, pageIndex) => (
        <ReportPage
          key={pageKeys.join('|')}
          pageNumber={pageIndex + 1}
          totalPages={totalPages}
          header={
            pageIndex === 0 ? (
              <ReportPageHeader variant="primary" {...headerProps} />
            ) : (
              compactHeader
            )
          }
        >
          {pageKeys.map((key) => (
            <div key={key} data-report-unit-in-page={key}>
              {unitByKey.get(key)}
            </div>
          ))}
        </ReportPage>
      ))}
    </div>
  );
}
