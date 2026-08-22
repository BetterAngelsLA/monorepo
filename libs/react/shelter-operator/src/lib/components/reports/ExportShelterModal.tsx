import { mergeCss } from '@monorepo/react/shared';
import { parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../base-ui/buttons/buttons';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../base-ui/modal';
import { Text } from '../base-ui/text/text';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import {
  ShelterReportPrint,
  type ExportMetric,
} from '../../pages/report/ShelterReportPrint';
import { useExportPdf } from '../../pages/report/useExportPdf';

type ExportFileType = 'PDF' | 'CSV' | 'XLSX' | 'JSON';

export interface IExportResult {
  success: boolean;
  /** Filename on success, error reason on failure. */
  description: string;
}

type ExportShelterModalProps = {
  isOpen: boolean;
  shelterId: string | undefined;
  shelterName?: string;
  shelterAddress?: string;
  onClose: () => void;
  onExport?: (result: IExportResult) => void;
};

// Only PDF is wired up for now — CSV/XLSX/JSON depend on a backend export
// endpoint that doesn't exist yet, so those options are shown (per design)
// but disabled.
const FILE_TYPES: ExportFileType[] = ['PDF', 'CSV', 'XLSX', 'JSON'];

const INCLUDED_METRICS: { label: string; value: ExportMetric }[] = [
  {
    label: 'Average days to occupancy',
    value: 'average-days-to-occupancy',
  },
  {
    label: 'Reservation status changes',
    value: 'reservation-status-changes',
  },
  {
    label: 'Bed status',
    value: 'bed-status',
  },
  {
    label: 'Daily occupancy',
    value: 'daily-occupancy',
  },
];

export function ExportShelterModal({
  isOpen,
  shelterId,
  shelterName,
  shelterAddress,
  onClose,
  onExport,
}: ExportShelterModalProps) {
  const [startDate, setStartDate] = useState('2026-05-02');
  const [endDate, setEndDate] = useState('2026-05-28');
  const [fileType, setFileType] = useState<ExportFileType>('PDF');
  const [includedMetrics, setIncludedMetrics] = useState<ExportMetric[]>(
    INCLUDED_METRICS.map((metric) => metric.value),
  );

  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  useEffect(() => {
    if (isOpen) setGeneratedAt(new Date());
  }, [isOpen]);

  const printRef = useRef<HTMLDivElement>(null);
  const { exportPdf, isExporting } = useExportPdf(printRef);

  const range = { from: parseISO(startDate), to: parseISO(endDate) };
  const { metrics } = useShelterOccupancyMetrics({
    // Piggyback on the hook's own `!shelterId` skip condition — it has no
    // separate skip param, and the modal shouldn't query while closed.
    shelterId: isOpen ? shelterId : undefined,
    startDate: range.from,
    endDate: range.to,
  });

  function toggleMetric(metric: ExportMetric) {
    setIncludedMetrics((currentMetrics) =>
      currentMetrics.includes(metric)
        ? currentMetrics.filter((currentMetric) => currentMetric !== metric)
        : [...currentMetrics, metric],
    );
  }

  async function handleExport() {
    if (fileType !== 'PDF' || !shelterId) return;

    try {
      const filename = `shelter-${shelterId}-report.pdf`;
      const { blob } = await exportPdf(filename);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      onClose();
      onExport?.({ success: true, description: filename });
    } catch (error) {
      onClose();
      onExport?.({
        success: false,
        description:
          error instanceof Error ? error.message : 'Unable to export data',
      });
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        className="animate-modal-in max-w-[625px] rounded-[28px]"
        backdropClassName="backdrop:bg-black/20 backdrop:backdrop-blur-xs"
      >
        <ModalHeader className="px-7 pb-1 pt-7" onClose={onClose}>
          <div className="flex flex-col gap-2">
            <Text
              variant="header-md"
              className="leading-none text-[#111827]"
              textColor="text-[#111827]"
            >
              Export Data
            </Text>
            <Text
              variant="caption"
              className="max-w-[52ch] text-pretty leading-5"
              textColor="text-[#6B7280]"
            >
              All page data, including date range, regional-level information,
              and shelter name, will be included along with data and charts in
              the export.
            </Text>
          </div>
        </ModalHeader>

        <ModalBody className="px-7 pb-1 pt-6">
          <div
            className={mergeCss([
              'space-y-7 transition-opacity duration-200',
              isExporting && 'pointer-events-none opacity-30',
            ])}
            aria-hidden={isExporting}
          >
            <section>
              <Text
                variant="body-lg"
                className="block"
                textColor="text-[#6B7280]"
              >
                Range
              </Text>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[1rem] leading-none text-[#111827]">
                <label className="flex items-center gap-2">
                  <span>From</span>
                  <span className="relative inline-flex items-center">
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="h-8 w-[8.75rem] rounded-lg border border-transparent bg-transparent py-1 pl-1.5 pr-6 font-mono text-[#6B7280] outline-none transition-colors [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 hover:border-[#D3D9E3] hover:bg-[#F9FAFB] focus:border-[#008CEE] focus:bg-white"
                    />
                    <Calendar
                      aria-hidden="true"
                      className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-[#111827]"
                    />
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <span>to</span>
                  <span className="relative inline-flex items-center">
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-8 w-[8.75rem] rounded-lg border border-transparent bg-transparent py-1 pl-1.5 pr-6 font-mono text-[#6B7280] outline-none transition-colors [color-scheme:light] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 hover:border-[#D3D9E3] hover:bg-[#F9FAFB] focus:border-[#008CEE] focus:bg-white"
                    />
                    <Calendar
                      aria-hidden="true"
                      className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-[#111827]"
                    />
                  </span>
                </label>
              </div>
            </section>

            <section>
              <Text
                variant="body-lg"
                className="block"
                textColor="text-[#6B7280]"
              >
                File Type
              </Text>
              <div
                className="mt-3 inline-flex rounded-full bg-[#F1F3F8] p-1"
                role="radiogroup"
                aria-label="Export file type"
              >
                {FILE_TYPES.map((type) => {
                  const isSelected = fileType === type;
                  // Only PDF is implemented — see FILE_TYPES comment above.
                  const isDisabled = type !== 'PDF';

                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isDisabled}
                      onClick={() => setFileType(type)}
                      className={mergeCss([
                        'min-w-14 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                        isSelected
                          ? 'bg-white text-[#111827] shadow-sm'
                          : 'text-[#374151] hover:text-[#111827]',
                        isDisabled &&
                          'cursor-not-allowed opacity-40 hover:text-[#374151]',
                      ])}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <Text
                variant="body-lg"
                className="block"
                textColor="text-[#6B7280]"
              >
                Included in Export
              </Text>
              <div className="mt-3 flex flex-col gap-3">
                {INCLUDED_METRICS.map((metric) => {
                  const checked = includedMetrics.includes(metric.value);

                  return (
                    <label
                      key={metric.value}
                      className="flex w-fit cursor-pointer items-center gap-3 text-[1rem] leading-none text-[#111827]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMetric(metric.value)}
                        className="h-4 w-4 accent-[#008CEE]"
                      />
                      <span>{metric.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>
        </ModalBody>

        <ModalFooter className="flex justify-end gap-5 px-7 pb-7 pt-8">
          <Button
            variant="floating-inverse"
            className="h-[54px] w-[213px] justify-center border-0 bg-white text-[#6B7280] shadow-[0_10px_24px_rgba(17,24,39,0.08)] hover:bg-[#F9FAFB] [&>span]:font-normal"
            rightIcon={false}
            onClick={onClose}
          >
            {isExporting ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="floating"
            color="blue"
            className="h-[54px] w-[213px] justify-center shadow-none [&>span]:font-normal"
            rightIcon={false}
            onClick={handleExport}
            disabled={isExporting || fileType !== 'PDF'}
          >
            {isExporting ? 'Generating…' : 'Export'}
          </Button>
        </ModalFooter>
      </Modal>

      {isOpen && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-9999px] top-0"
        >
          <ShelterReportPrint
            ref={printRef}
            shelterName={shelterName}
            shelterAddress={shelterAddress}
            range={range}
            generatedAt={generatedAt}
            includedMetrics={includedMetrics}
            metrics={metrics?.reservationMetrics}
            avgDaysToOccupancy={metrics?.avgDaysToOccupancy}
            dailyBedStatus={metrics?.dailyBedStatus}
            dailyOccupancy={metrics?.dailyOccupancy}
          />
        </div>
      )}
    </>
  );
}
