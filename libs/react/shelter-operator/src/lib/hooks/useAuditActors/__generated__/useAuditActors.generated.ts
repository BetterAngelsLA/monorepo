import type * as Types from '@monorepo/ba-platform/types';

import type { DateString, DateTimeString, PhoneNumberString, TimeString, UUIDString } from '@monorepo/shared/scalars';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AuditActorsQueryVariables = Types.Exact<{
  targetType: Types.AuditTargetType;
  objectId: Types.Scalars['ID']['input'];
  search: Types.Scalars['String']['input'];
  limit: Types.Scalars['Int']['input'];
}>;


export type AuditActorsQuery = { __typename: 'Query', objectAuditActors: Array<{ __typename: 'AuditActorType', id?: string | null, label: string, isSystem: boolean }> };


export const AuditActorsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuditActors"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AuditTargetType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"objectAuditActors"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"targetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"objectId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]}}]} as unknown as DocumentNode<AuditActorsQuery, AuditActorsQueryVariables>;