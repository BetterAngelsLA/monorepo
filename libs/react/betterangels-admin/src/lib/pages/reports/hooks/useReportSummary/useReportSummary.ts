import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import {
  ReportSummaryDocument,
  type ReportSummaryQuery,
  type ReportSummaryQueryVariables,
} from './__generated__/reports.generated';

/** The aggregate figures rendered as KPIs and charts on the Reports page. */
export type ReportSummaryType = ReportSummaryQuery['reportSummary'];

type UseReportSummaryArgs = {
  organizationId: string;
  startDate: string;
  endDate: string;
  /** The geographic group the page is scoped to; absent means the whole organization. */
  dimension?: RegionDimension;
  /** Specific regions within `dimension`; absent means every region of it. */
  regionCodes?: string[];
};

/**
 * The aggregate figures rendered as KPIs and charts on the Reports page.
 *
 * **The previous summary is kept while a new date range or group loads.** A new range or group
 * makes this a different query as far as the cache is concerned, so `data` is `undefined` for
 * the whole round trip. The page renders its skeletons on an empty summary, which means
 * changing the range replaced every card — including the map panel below them — with
 * placeholder shapes: the map was torn down and rebuilt, and the page lost enough height that
 * the browser clamped the reader's scroll position to the top. Holding the last summary keeps
 * the page intact and turns the refetch into a dimmed overlay instead of a rebuild.
 *
 * `loading` still reports the truth, so the page can show that it is working.
 *
 * The group travels with the range: `dimension` alone means every region of it, and
 * `regionCodes` is sent only when some are selected.
 */
export function useReportSummary({
  organizationId,
  startDate,
  endDate,
  dimension,
  regionCodes,
}: UseReportSummaryArgs) {
  const { data, previousData, loading, error } = useQuery<
    ReportSummaryQuery,
    ReportSummaryQueryVariables
  >(ReportSummaryDocument, {
    variables: {
      organizationId,
      startDate,
      endDate,
      dimension,
      // An empty list is a selection of nothing; omit it so the backend scopes to the
      // dimension.
      regionCodes: regionCodes?.length ? regionCodes : undefined,
    },
    skip: !organizationId,
  });

  const activeData = data ?? previousData;

  return {
    summary: activeData?.reportSummary,
    loading,
    error,
  };
}
