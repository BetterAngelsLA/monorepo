import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { format } from 'date-fns';
import type { ReactNode, Ref } from 'react';
import {
  BedStatusChart,
  DailyOccupancyChart,
} from '../../components/reports/ReportCharts';
import { Text } from '../../components/base-ui/text/text';
import type {
  DailyBedStatusMetrics,
  DailyOccupancyMetrics,
  ReservationMetrics,
} from '../../hooks/useShelterOccupancyMetrics';
import { ReportOperationalStats } from './ReportOperationalStats';

export type ExportMetric =
  | 'average-days-to-occupancy'
  | 'reservation-status-changes'
  | 'bed-status'
  | 'daily-occupancy';

// US Letter, portrait, at 96dpi (8.5in x 11in). Fixed so each page's raster
// capture is identical regardless of the browser window that generated it.
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const PAGE_PADDING = 48;

// Matches the stat tray's grey background instead of the live dashboard's
// white shadowed chart card.
const CHART_CONTAINER_CLASSNAME = 'bg-[#F9F9F9] shadow-none';

export interface IShelterReportPrintProps {
  shelterName?: string;
  shelterAddress?: string;
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
  children: ReactNode;
}

/** One physical printed page: fixed Letter size, repeated footer (logo + page number). */
function ReportPage({ pageNumber, totalPages, children }: IReportPageProps) {
  return (
    <div
      data-report-page="true"
      className="report-page relative flex flex-col bg-white"
      style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: PAGE_PADDING }}
    >
      {children}

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

/**
 * Presentational, chrome-less multi-page report captured by html2canvas-pro
 * (see useExportPdf.ts) — one canvas per `.report-page` node, assembled into
 * a matching multi-page PDF, so section breaks land exactly where they do on
 * screen instead of an arbitrary pixel-height slice. Every page is a fixed
 * Letter size (see PAGE_WIDTH/PAGE_HEIGHT above) so the raster output is
 * identical regardless of the browser window that generated it.
 */
export function ShelterReportPrint({
  shelterName,
  shelterAddress,
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
    'reservation-status-changes',
  );
  const showAvgDaysToOccupancy = includedMetrics.includes(
    'average-days-to-occupancy',
  );
  const showStats = showReservationStatusChanges || showAvgDaysToOccupancy;
  const showBedStatus = includedMetrics.includes('bed-status');
  const showDailyOccupancy = includedMetrics.includes('daily-occupancy');

  // Daily Occupancy only gets its own page when Bed Status is also shown —
  // otherwise it moves up onto page 1 with the stats instead of leaving page
  // 1 mostly empty and forcing a second page for a single chart.
  const showBothCharts = showBedStatus && showDailyOccupancy;
  const dailyOccupancyOnPageOne = showDailyOccupancy && !showBothCharts;

  const hasPageOne = showStats || showBedStatus || dailyOccupancyOnPageOne;
  const hasPageTwo = showBothCharts;
  const totalPages = (hasPageOne ? 1 : 0) + (hasPageTwo ? 1 : 0);

  const headerProps = { shelterName, shelterAddress, range, generatedAt };

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-6 bg-[#E5E7EB] p-10"
    >
      {hasPageOne && (
        <ReportPage pageNumber={1} totalPages={totalPages}>
          <ReportPageHeader variant="primary" {...headerProps} />
          <div className="mt-6 flex flex-col gap-6">
            {showStats && (
              <ReportOperationalStats
                showReservationStatusChanges={showReservationStatusChanges}
                showAvgDaysToOccupancy={showAvgDaysToOccupancy}
                metrics={metrics}
                avgDaysToOccupancy={avgDaysToOccupancy}
              />
            )}
            {showBedStatus && (
              <BedStatusChart
                data={dailyBedStatus}
                showViewToggle={false}
                containerClassName={CHART_CONTAINER_CLASSNAME}
              />
            )}
            {dailyOccupancyOnPageOne && (
              <DailyOccupancyChart
                data={dailyOccupancy}
                showViewToggle={false}
                containerClassName={CHART_CONTAINER_CLASSNAME}
              />
            )}
          </div>
        </ReportPage>
      )}

      {hasPageTwo && (
        <ReportPage pageNumber={hasPageOne ? 2 : 1} totalPages={totalPages}>
          <ReportPageHeader variant="compact" {...headerProps} />
          <div className="mt-6 flex flex-col gap-6">
            <DailyOccupancyChart
              data={dailyOccupancy}
              showViewToggle={false}
              containerClassName={CHART_CONTAINER_CLASSNAME}
            />
          </div>
        </ReportPage>
      )}
    </div>
  );
}
