import type * as Types from '@monorepo/ba-platform/types';

import type { DateString, DateTimeString, PhoneNumberString, TimeString, UUIDString } from '@monorepo/shared/scalars';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type TeamsQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.TeamFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type TeamsQuery = { __typename?: 'Query', teams: { __typename?: 'TeamTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'TeamType', id: string, name: string, isActive?: boolean | null }> } };


export const TeamsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Teams"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TeamFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OffsetPaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teams"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<TeamsQuery, TeamsQueryVariables>;