import { useQuery } from '@apollo/client/react';
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
};

/**
 * The aggregate figures rendered as KPIs and charts on the Reports page.
 *
 * **The previous summary is kept while a new date range loads.** A new range makes this a
 * different query as far as the cache is concerned, so `data` is `undefined` for the whole
 * round trip. The page renders its skeletons on an empty summary, which means changing the
 * range replaced every card — including the map panel below them — with placeholder shapes:
 * the map was torn down and rebuilt, and the page lost enough height that the browser clamped
 * the reader's scroll position to the top. Holding the last summary keeps the page intact and
 * turns the refetch into a dimmed overlay instead of a rebuild.
 *
 * `loading` still reports the truth, so the page can show that it is working.
 */
export function useReportSummary({
  organizationId,
  startDate,
  endDate,
}: UseReportSummaryArgs) {
  const { data, previousData, loading, error } = useQuery<
    ReportSummaryQuery,
    ReportSummaryQueryVariables
  >(ReportSummaryDocument, {
    variables: { organizationId, startDate, endDate },
    skip: !organizationId,
  });

  const activeData = data ?? previousData;

  return {
    summary: activeData?.reportSummary,
    loading,
    error,
  };
}
