import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type HmisClientProgramsQueryVariables = Types.Exact<{
  clientId: Types.Scalars['ID']['input'];
}>;


export type HmisClientProgramsQuery = { __typename?: 'Query', hmisClientPrograms: Array<{ __typename: 'HmisClientProgramType', id: string, program: { __typename?: 'HmisProgramType', id: string, name: string } }> };


export const HmisClientProgramsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"hmisClientPrograms"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hmisClientPrograms"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HmisClientProgramType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"program"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<HmisClientProgramsQuery, HmisClientProgramsQueryVariables>;