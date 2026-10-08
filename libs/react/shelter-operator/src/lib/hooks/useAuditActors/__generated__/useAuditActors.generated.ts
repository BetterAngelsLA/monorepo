import type * as Types from '@monorepo/ba-platform/types';

import type { DateString, DateTimeString, PhoneNumberString, TimeString, UUIDString } from '@monorepo/shared/scalars';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AuditActorsQueryVariables = Types.Exact<{
  organizationId: Types.Scalars['String']['input'];
}>;


export type AuditActorsQuery = { __typename: 'Query', organizationMembers: { __typename: 'OrganizationMemberTypeOffsetPaginated', results: Array<{ __typename: 'OrganizationMemberType', id: string, firstName?: string | null, lastName?: string | null, email?: string | null }> } };


export const AuditActorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuditActors"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizationMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<AuditActorsQuery, AuditActorsQueryVariables>;