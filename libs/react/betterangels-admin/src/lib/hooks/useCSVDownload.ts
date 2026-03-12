import { useCallback, useState } from 'react';

export default function useCSVDownload(
  fetchClient: (url: string) => Promise<Response>
) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (startDate: string, endDate: string, orgId?: string) => {
      setIsDownloading(true);
      setError(null);
      try {
        let url = `/reports/export/?start_date=${startDate}&end_date=${endDate}`;
        if (orgId) {
          url += `&org_id=${orgId}`;
        }
        const response = await fetchClient(url);
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
    [fetchClient]
  );

  return { download, isDownloading, error, clearError: () => setError(null) };
}
