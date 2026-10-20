import { useCallback, useState } from 'react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { useApiConfig } from '../providers';

/**
 * The geographic group a download should cover.
 *
 * `dimension` is sent in the endpoint's wire spelling — the lowercase `kind` the tile endpoint
 * also reads (`RegionDimension.CITY` -> `city`) — and only when the page is grouped, so an
 * ungrouped download stays the organisation-wide export it always was. `codes` is omitted
 * rather than sent empty when no region is chosen: an absent list means "every region of the
 * dimension", while an explicit empty list means "no region" and would download an empty file.
 */
type DownloadGroup = {
  dimension?: RegionDimension;
  codes?: string[];
};

export default function useCSVDownload() {
  const { fetch } = useApiConfig();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (
      startDate: string,
      endDate: string,
      orgId?: string,
      group?: DownloadGroup,
    ) => {
      setIsDownloading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
        });
        if (orgId) {
          params.set('org_id', orgId);
        }
        if (group?.dimension) {
          params.set('dimension', group.dimension.toLowerCase());
        }
        // Repeated parameters, which is what the endpoint reads; the page's selection is a
        // list and a comma-joined string would be a second dialect to keep in step.
        for (const code of group?.codes ?? []) {
          params.append('codes', code);
        }
        const response = await fetch(`/reports/export/?${params.toString()}`);
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
