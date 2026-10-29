import { useQuery } from '@apollo/client/react';
import { useAtom } from 'jotai';
import { Download } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '../base-ui/buttons/buttons';
import { useToast } from '../base-ui/toast';
import {
  DateRangePicker,
  DateRangePresetDropdown,
  dateRangeFilterAtom,
  type DateRange,
} from '../date-range-filter';
import { OperatorShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { ShelterReportPrint } from '../../pages/report/ShelterReportPrint';
import { useExportPdf } from '../../pages/report/useExportPdf';
import { ExportDataModal, type ModalExportFormat } from './ExportDataModal';
import {
  useShelterMetricsExport,
  type ExportMetric,
} from './useShelterMetricsExport';

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
 * left, export on the right. The range comes from `dateRangeFilterAtom`, the
 * same one the charts use.
 */
export function ReportFilterBar({ shelterId }: { shelterId?: string }) {
  const [{ range }, setFilter] = useAtom(dateRangeFilterAtom);
  const { exportMetrics, isExporting: isBackendExporting } =
    useShelterMetricsExport();
  const { showToast } = useToast();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [previewCustom, setPreviewCustom] = useState(false);

  const handleCalendarOpenChange = useCallback((open: boolean) => {
    setIsCalendarOpen(open);
    if (!open) setPreviewCustom(false);
  }, []);

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
  const pdfAbortRef = useRef<AbortController | null>(null);
  const { exportPdf, isExporting: isPdfExporting } = useExportPdf(printRef);

  // Closing the modal unmounts the off-screen report. Abort an in-flight
  // capture so it stops touching a detached node, and so the pending promise
  // settles instead of rejecting with an html2canvas-internal error.
  useEffect(() => {
    if (isExportOpen) return;
    pdfAbortRef.current?.abort();
    pdfAbortRef.current = null;
  }, [isExportOpen]);

  useEffect(() => () => pdfAbortRef.current?.abort(), []);

  const {
    data: shelterData,
    loading: isShelterDataLoading,
    error: shelterDataError,
  } = useQuery(OperatorShelterSummaryDocument, {
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

    const filename = `shelter-${shelterId}-report.pdf`;
    pdfAbortRef.current?.abort();
    const controller = new AbortController();
    pdfAbortRef.current = controller;

    try {
      // `null` means the export was cancelled (modal closed, report unmounted)
      // rather than failed — nothing to download and nothing to report.
      const result = await exportPdf(filename, { signal: controller.signal });
      if (!result) return;

      const { blob } = result;
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
    } finally {
      if (pdfAbortRef.current === controller) pdfAbortRef.current = null;
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
        <DateRangePicker
          className="w-80"
          value={range}
          open={isCalendarOpen}
          onOpenChange={handleCalendarOpenChange}
          onDirty={() => setPreviewCustom(true)}
          onCommit={(next) => {
            setFilter({ preset: 'CUSTOM', range: next });
            setPreviewCustom(false);
          }}
        />
        <DateRangePresetDropdown
          className="w-56"
          displayPreset={previewCustom ? 'CUSTOM' : undefined}
          onCustomSelected={() => handleCalendarOpenChange(true)}
        />
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
          disablePdfExport={isPdfDataUnavailable}
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
            organizationName={shelterData?.operatorShelter?.organization?.name}
            bedCounts={shelterData?.operatorShelter?.bedCounts}
            roomCounts={shelterData?.operatorShelter?.roomCounts}
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
