import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import { Button } from '../base-ui/buttons/buttons';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../base-ui/modal';
import { Text } from '../base-ui/text/text';
import {
  EXPORT_FORMATS,
  EXPORT_METRICS,
  type ExportFormat,
  type ExportMetric,
} from './useShelterMetricsExport';

/**
 * PDF is rendered client-side (see useExportPdf.ts) rather than through the
 * `ShelterMetricsExportApi` the other three formats hit, but it shares the
 * same file-type picker and metric checkboxes.
 */
export type ModalExportFormat = ExportFormat | 'pdf';
const MODAL_FORMATS: ModalExportFormat[] = ['pdf', ...EXPORT_FORMATS];

const FORMAT_LABELS: Record<ModalExportFormat, string> = {
  pdf: 'PDF',
  csv: 'CSV',
  xlsx: 'XLSX',
  json: 'JSON',
};

const METRIC_LABELS: Record<ExportMetric, string> = {
  daily_occupancy_metrics: 'Daily occupancy',
  daily_bed_status_metrics: 'Bed status',
  reservation_metrics: 'Reservation status changes',
  avg_days_to_occupancy: 'Average days to occupancy',
};

const ALL_METRICS = [...EXPORT_METRICS];

type ExportDataModalProps = {
  isOpen: boolean;
  isExporting: boolean;
  /** Human-readable range, so the modal states what it will export. */
  rangeLabel: string;
  onClose: () => void;
  onExport: (format: ModalExportFormat, metrics: ExportMetric[]) => void;
};

export function ExportDataModal({
  isOpen,
  isExporting,
  rangeLabel,
  onClose,
  onExport,
}: ExportDataModalProps) {
  // Keeps CSV as the default selection — matches the existing export tests'
  // expectations, PDF is just added as another option in the picker.
  const [format, setFormat] = useState<ModalExportFormat>('csv');
  const [metrics, setMetrics] = useState<ExportMetric[]>([...ALL_METRICS]);

  function toggleMetric(metric: ExportMetric) {
    setMetrics((current) =>
      current.includes(metric)
        ? current.filter((selected) => selected !== metric)
        : [...current, metric],
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex flex-col gap-2">
          <Text variant="header-md" textColor="text-[#111827]">
            Export Data
          </Text>
          <Text variant="caption" textColor="text-[#6B7280]">
            Covers {rangeLabel}, the range currently shown on the report.
          </Text>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="flex flex-col gap-7">
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
              {MODAL_FORMATS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={format === option}
                  onClick={() => setFormat(option)}
                  className={mergeCss([
                    'min-w-14 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    format === option
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#374151] hover:text-[#111827]',
                  ])}
                >
                  {FORMAT_LABELS[option]}
                </button>
              ))}
            </div>
            {format === 'csv' && (
              <Text
                variant="caption"
                className="mt-2 block"
                textColor="text-[#6B7280]"
              >
                CSV holds one table, so the metrics arrive as a zip.
              </Text>
            )}
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
              {EXPORT_METRICS.map((metric) => (
                <label
                  key={metric}
                  className="flex w-fit cursor-pointer items-center gap-3 text-[1rem] leading-none text-[#111827]"
                >
                  <input
                    type="checkbox"
                    checked={metrics.includes(metric)}
                    onChange={() => toggleMetric(metric)}
                    className="h-4 w-4 accent-[#008CEE]"
                  />
                  <span>{METRIC_LABELS[metric]}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </ModalBody>

      <ModalFooter className="flex justify-end gap-3">
        <Button variant="primary" rightIcon={false} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          color="blue"
          rightIcon={false}
          disabled={isExporting || metrics.length === 0}
          onClick={() => onExport(format, metrics)}
        >
          {isExporting ? 'Exporting…' : 'Export'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
