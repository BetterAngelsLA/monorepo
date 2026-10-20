import { useCallback, useState } from 'react';
import { interactionExportUrl, type ReportGroup } from '../api/reports';
import { useApiConfig } from '../providers';

/** Download the Reports CSV; the endpoint and params live in `api/reports`. */
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
        const anchor = Object.assign(document.createElement('a'), {
          href: blobUrl,
          download: filename,
        });
        // Appending is what makes the download work in Safari; revoking on the next tick
        // gives the click time to start reading the blob.
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
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
