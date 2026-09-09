import { useApiConfig } from '@monorepo/react/shelter';
import { toDateString } from '@monorepo/shared/scalars';
import { useState } from 'react';
import { useToast } from '../base-ui/toast';
import type { DateRange } from '../date-range-filter';

/** Mirrors ``MetricsExportOptions`` in ``shelters/services/metrics_export.py``. */
export const EXPORT_METRICS = [
  'daily_occupancy_metrics',
  'daily_bed_status_metrics',
  'reservation_metrics',
  'avg_days_to_occupancy',
] as const;

export type ExportMetric = (typeof EXPORT_METRICS)[number];

/** Formats served by ``ShelterMetricsExportApi``. CSV arrives as a zip. */
export const EXPORT_FORMATS = ['csv', 'xlsx', 'json'] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Reads the download name the server chose, e.g. `attachment; filename="a.zip"`. */
function filenameFrom(disposition: string | null, fallback: string): string {
  return disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallback;
}

type ExportArgs = {
  shelterId: string;
  range: DateRange;
  format: ExportFormat;
  metrics: readonly ExportMetric[];
};

export function useShelterMetricsExport() {
  const { fetch } = useApiConfig();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  async function exportMetrics({
    shelterId,
    range,
    format,
    metrics,
  }: ExportArgs) {
    const params = new URLSearchParams({ export_format: format });

    if (range.from) params.set('start_date', toDateString(range.from));
    if (range.to) params.set('end_date', toDateString(range.to));
    metrics.forEach((metric) => params.append('include', metric));

    setIsExporting(true);

    try {
      const response = await fetch(`/shelters/${shelterId}/export/?${params}`);

      if (!response.ok) {
        throw new Error(`The server returned ${response.status}.`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = filenameFrom(
        response.headers.get('Content-Disposition'),
        `shelter-report.${format === 'csv' ? 'zip' : format}`,
      );

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

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
      setIsExporting(false);
    }
  }

  return { exportMetrics, isExporting };
}
