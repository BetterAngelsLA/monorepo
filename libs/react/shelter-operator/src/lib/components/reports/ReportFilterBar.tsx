import { useQuery } from '@apollo/client/react';
import { useAtomValue } from 'jotai';
import { Calendar, ChevronDown, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '../base-ui/buttons/buttons';
import { Text } from '../base-ui/text/text';
import { useToast } from '../base-ui/toast';
import { dateRangeFilterAtom, type DateRange } from '../date-range-filter';
import { GetShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { ShelterReportPrint } from '../../pages/report/ShelterReportPrint';
import { useExportPdf } from '../../pages/report/useExportPdf';
import { ExportDataModal, type ModalExportFormat } from './ExportDataModal';
import {
  useShelterMetricsExport,
  type ExportMetric,
} from './useShelterMetricsExport';

const fieldClassName =
  'flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2';

/** Placeholder for the date-range filter — replaced by the real filtering component later. */
function DateRangeFilterPlaceholder() {
  return (
    <div className={fieldClassName} aria-hidden="true">
      <Text variant="body" textColor="text-[#9CA3AF]">
        YYYY-MM-DD – YYYY-MM-DD
      </Text>
      <Calendar size={18} className="text-[#6B7280]" />
    </div>
  );
}

/** Placeholder for the date-range preset dropdown (e.g. "Last 30 Days"). */
function DatePresetPlaceholder() {
  return (
    <div className={fieldClassName} aria-hidden="true">
      <Text variant="body" textColor="text-[#6B7280]">
        Last 30 Days
      </Text>
      <ChevronDown size={18} className="text-[#6B7280]" />
    </div>
  );
}

function rangeLabel({ from, to }: DateRange): string {
  if (!from || !to) {
    return 'the default range';
  }

  const format = (date: Date) =>
    date.toLocaleDateString('en-US', { dateStyle: 'medium' });

  return `${format(from)} – ${format(to)}`;
}

/**
 * Top toolbar of the reporting Overview tab: date-range + preset filters on the
 * left, export on the right. The date controls are still placeholders; the
 * range itself comes from `dateRangeFilterAtom`, the same one the charts use.
 */
export function ReportFilterBar({ shelterId }: { shelterId?: string }) {
  const { range } = useAtomValue(dateRangeFilterAtom);
  const { exportMetrics, isExporting: isBackendExporting } =
    useShelterMetricsExport();
  const { showToast } = useToast();
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Refreshed each time the modal opens, so "Exported at" on the PDF reads
  // the actual generation time rather than when the tab first loaded.
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  useEffect(() => {
    if (isExportOpen) setGeneratedAt(new Date());
  }, [isExportOpen]);

  // The PDF's off-screen render only needs to reflect the exact metrics list
  // the user just submitted — see handlePdfExport.
  const [pdfMetrics, setPdfMetrics] = useState<ExportMetric[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const { exportPdf, isExporting: isPdfExporting } = useExportPdf(printRef);

  const {
    data: shelterData,
    loading: isShelterDataLoading,
    error: shelterDataError,
  } = useQuery(GetShelterSummaryDocument, {
    variables: { id: shelterId ?? '' },
    skip: !shelterId || !isExportOpen,
  });
  const {
    metrics,
    loading: isMetricsLoading,
    error: metricsError,
  } = useShelterOccupancyMetrics({
    // Piggyback on the hook's own `!shelterId` skip condition — it has no
    // separate skip param, and there's nothing to render off-screen while
    // the modal is closed.
    shelterId: isExportOpen ? shelterId : undefined,
    startDate: range.from,
    endDate: range.to,
  });

  // Both queries above feed the off-screen ShelterReportPrint that PDF
  // export captures. Until they've resolved successfully, that render would
  // show fallback names, em-dash stats, and empty charts instead of the
  // selected range's real data — so Export stays disabled rather than
  // letting handlePdfExport silently capture an incomplete report.
  const isPdfDataUnavailable =
    isExportOpen &&
    (isShelterDataLoading ||
      isMetricsLoading ||
      Boolean(shelterDataError) ||
      Boolean(metricsError));

  async function handlePdfExport(selectedMetrics: ExportMetric[]) {
    if (!shelterId) return;

    // flushSync forces the off-screen ShelterReportPrint to actually commit
    // the newly-selected metrics to the DOM before exportPdf reads it —
    // without it, the state update would still be batched when the capture
    // starts, and it would rasterize last render's content instead. This is
    // one of the narrow cases React's own docs call out flushSync for:
    // synchronously flushing before something that reads the DOM directly.
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync
    flushSync(() => setPdfMetrics(selectedMetrics));

    try {
      const filename = `shelter-${shelterId}-report.pdf`;
      const { blob } = await exportPdf(filename);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast({
        status: 'success',
        title: 'Report generated',
        description: filename,
      });
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Generation failed',
        description:
          error instanceof Error ? error.message : 'Unable to export data.',
      });
    }
  }

  async function handleExport(
    format: ModalExportFormat,
    selectedMetrics: ExportMetric[],
  ) {
    if (!shelterId) return;

    if (format === 'pdf') {
      await handlePdfExport(selectedMetrics);
    } else {
      await exportMetrics({
        shelterId,
        range,
        format,
        metrics: selectedMetrics,
      });
    }

    setIsExportOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilterPlaceholder />
        <DatePresetPlaceholder />
      </div>

      <Button
        variant="primary"
        leftIcon={<Download size={20} color="black" />}
        rightIcon={false}
        className="text-black"
        disabled={!shelterId}
        onClick={() => setIsExportOpen(true)}
      >
        Export Data
      </Button>

      {shelterId && (
        <ExportDataModal
          isOpen={isExportOpen}
          isExporting={isBackendExporting || isPdfExporting}
          disableExport={isPdfDataUnavailable}
          rangeLabel={rangeLabel(range)}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
        />
      )}

      {isExportOpen && shelterId && range.from && range.to && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-9999px] top-0"
        >
          <ShelterReportPrint
            ref={printRef}
            shelterName={shelterData?.operatorShelter?.name}
            shelterAddress={
              shelterData?.operatorShelter?.location?.place ?? undefined
            }
            range={{ from: range.from, to: range.to }}
            generatedAt={generatedAt}
            includedMetrics={pdfMetrics}
            metrics={metrics?.reservationMetrics}
            avgDaysToOccupancy={metrics?.avgDaysToOccupancy}
            dailyBedStatus={metrics?.dailyBedStatus}
            dailyOccupancy={metrics?.dailyOccupancy}
          />
        </div>
      )}
    </div>
  );
}
