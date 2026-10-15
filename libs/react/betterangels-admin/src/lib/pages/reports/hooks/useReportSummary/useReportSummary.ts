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

export function useReportSummary({
  organizationId,
  startDate,
  endDate,
}: UseReportSummaryArgs) {
  const { data, loading, error } = useQuery<
    ReportSummaryQuery,
    ReportSummaryQueryVariables
  >(ReportSummaryDocument, {
    variables: { organizationId, startDate, endDate },
    skip: !organizationId,
  });

  return {
    summary: data?.reportSummary,
    loading,
    error,
  };
}
