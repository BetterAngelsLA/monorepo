import type * as Types from '@monorepo/ba-platform/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type GetShelterOccupancyMetricsQueryVariables = Types.Exact<{
  shelterId: Types.Scalars['ID']['input'];
}>;


export type GetShelterOccupancyMetricsQuery = { __typename: 'Query', shelterOccupancyMetrics: { __typename: 'ShelterOccupancyMetricsType', avgDaysToOccupancy?: number | null, reservationMetrics: { __typename: 'ReservationMetricsType', checkInOverdue: number, cancelled: number, checkedIn: number, checkInOverdueToCheckedIn: number } } };


export const GetShelterOccupancyMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetShelterOccupancyMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"shelterId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shelterOccupancyMetrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"shelterId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"shelterId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reservationMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkInOverdue"}},{"kind":"Field","name":{"kind":"Name","value":"cancelled"}},{"kind":"Field","name":{"kind":"Name","value":"checkedIn"}},{"kind":"Field","name":{"kind":"Name","value":"checkInOverdueToCheckedIn"}}]}},{"kind":"Field","name":{"kind":"Name","value":"avgDaysToOccupancy"}}]}}]}}]} as unknown as DocumentNode<GetShelterOccupancyMetricsQuery, GetShelterOccupancyMetricsQueryVariables>;