import { mergeCss } from '@monorepo/react/shared';
import { useApiConfig } from '@monorepo/react/shelter';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/base-ui/buttons/buttons';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '../../../components/base-ui/modal';
import { Text } from '../../../components/base-ui/text/text';

type ExportFileType = 'PDF' | 'CSV' | 'XLSX' | 'JSON';
type ExportMetric =
  | 'average-days-to-occupancy'
  | 'reservation-status-changes'
  | 'bed-status'
  | 'daily-occupancy';

type ExportShelterModalProps = {
  isOpen: boolean;
  shelterId: string | undefined;
  onClose: () => void;
};

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
  onClose,
}: ExportShelterModalProps) {
  const [startDate, setStartDate] = useState('2026-05-02');
  const [endDate, setEndDate] = useState('2026-05-28');
  const [fileType, setFileType] = useState<ExportFileType>('PDF');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [includedMetrics, setIncludedMetrics] = useState<ExportMetric[]>(
    INCLUDED_METRICS.map((metric) => metric.value)
  );
  const [isExporting, setIsExporting] = useState(false);
  const { fetchClient } = useApiConfig();

  function toggleMetric(metric: ExportMetric) {
    setIncludedMetrics((currentMetrics) =>
      currentMetrics.includes(metric)
        ? currentMetrics.filter((currentMetric) => currentMetric !== metric)
        : [...currentMetrics, metric]
    );
  }

  async function handleExport() {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      format: fileType.toLowerCase(),
    });

    includedMetrics.forEach((metric) => {
      params.append('include', metric);
    });

    setIsExporting(true);

    try {
      const response = await fetchClient(
        `/shelter/${shelterId}/export/?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `shelter-${shelterId}-export.${fileType.toLowerCase()}`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to export data'
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-w-[625px] rounded-[28px]"
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
            All page data, including date range, regional-level information, and
            shelter name, will be included along with data and charts in the
            export.
          </Text>
        </div>
      </ModalHeader>

      <ModalBody className="px-7 pb-1 pt-6">
        <div className="space-y-7">
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

                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setFileType(type)}
                    className={mergeCss([
                      'min-w-14 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-white text-[#111827] shadow-sm'
                        : 'text-[#374151] hover:text-[#111827]',
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
          Back
        </Button>
        <Button
          variant="floating"
          color="blue"
          className="h-[54px] w-[213px] justify-center shadow-none [&>span]:font-normal"
          rightIcon={false}
        >
          Export
        </Button>
      </ModalFooter>
    </Modal>
  );
}
