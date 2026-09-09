import type { GetShelterOperatorOverviewQuery } from '../../components/overview/__generated__/overview.generated';

/**
 * The shelter data the printed report renders — the `operatorShelter` shape
 * returned by GetShelterOperatorOverview. Derived from codegen so the report
 * follows the query rather than drifting from it.
 */
export type ShelterReportData =
  GetShelterOperatorOverviewQuery['operatorShelter'];
