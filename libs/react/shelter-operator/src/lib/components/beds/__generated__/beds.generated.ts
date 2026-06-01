import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type GetShelterBedsQueryVariables = Types.Exact<{
  shelterId: Types.Scalars['ID']['input'];
}>;


export type GetShelterBedsQuery = { __typename?: 'Query', beds: { __typename?: 'BedTypeOffsetPaginated', results: Array<{ __typename?: 'BedType', id: string, bedName?: string | null, status?: Types.BedStatusChoices | null, maintenanceFlag: boolean, bedType?: Types.BedTypeChoices | null, room?: { __typename?: 'RoomType', id: string, roomIdentifier: string } | null }> } };


export const GetShelterBedsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetShelterBeds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"shelterId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"beds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shelterId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"shelterId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bedName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"maintenanceFlag"}},{"kind":"Field","name":{"kind":"Name","value":"bedType"}},{"kind":"Field","name":{"kind":"Name","value":"room"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roomIdentifier"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetShelterBedsQuery, GetShelterBedsQueryVariables>;