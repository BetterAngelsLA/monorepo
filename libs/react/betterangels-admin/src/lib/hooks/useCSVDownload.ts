import { useCallback, useState } from 'react';
import { interactionExportUrl, type ReportGroup } from '../api/reports';
import { useApiConfig } from '../providers';

/**
 * Download the Reports CSV for a window and an optional geographic group.
 *
 * The endpoint, its parameters and their spellings live in `api/reports`; this hook owns the
 * browser mechanics (blob, object URL, filename) and the busy/error state. The page passes the
 * same group it shows in the charts, so the file covers the same population.
 */
export default function useCSVDownload() {
  const { fetch } = useApiConfig();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (
      startDate: string,
      endDate: string,
      orgId?: string,
      group?: ReportGroup,
    ) => {
      setIsDownloading(true);
      setError(null);
      try {
        const response = await fetch(
          interactionExportUrl({
            startDate,
            endDate,
            organizationId: orgId,
            group,
          }),
        );
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? `Export failed (${response.status})`);
        }
        const blob = await response.blob();
        const filename =
          response.headers
            .get('Content-Disposition')
            ?.match(/filename="(.+)"/)?.[1] ??
          `interaction_data_${startDate}_${endDate}.csv`;
        const blobUrl = window.URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), {
          href: blobUrl,
          download: filename,
        }).click();
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsDownloading(false);
      }
    },
    [fetch],
  );

  return { download, isDownloading, error, clearError: () => setError(null) };
}
