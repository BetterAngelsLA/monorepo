import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type RoomsQueryVariables = Types.Exact<{
  shelterId: Types.Scalars['ID']['input'];
}>;


export type RoomsQuery = { __typename: 'Query', rooms: { __typename: 'RoomTypeOffsetPaginated', totalCount: number, results: Array<{ __typename: 'RoomType', id: string, name: string, status: Types.RoomStatusChoices, amenities?: string | null, medicalRespite: boolean }> } };


export const RoomsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Rooms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"shelterId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rooms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"shelterId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"shelterId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"amenities"}},{"kind":"Field","name":{"kind":"Name","value":"medicalRespite"}}]}}]}}]}}]} as unknown as DocumentNode<RoomsQuery, RoomsQueryVariables>;