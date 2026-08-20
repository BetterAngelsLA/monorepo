import type * as Types from '@monorepo/ba-platform/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ShelterOperatorOrganizationsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type ShelterOperatorOrganizationsQuery = { __typename: 'Query', shelterOperatorOrganizations: { __typename: 'OrganizationTypeOffsetPaginated', results: Array<{ __typename: 'OrganizationType', id: string, name: string }> } };


export const ShelterOperatorOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShelterOperatorOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shelterOperatorOrganizations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1000"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"ordering"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"EnumValue","value":"ASC"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ShelterOperatorOrganizationsQuery, ShelterOperatorOrganizationsQueryVariables>;