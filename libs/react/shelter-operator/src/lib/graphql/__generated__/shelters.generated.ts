import type * as Types from '../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ViewSheltersByOrganizationQueryVariables = Types.Exact<{
  organizationId: Types.Scalars['ID']['input'];
}>;


export type ViewSheltersByOrganizationQuery = { __typename?: 'Query', sheltersByOrganization: { __typename?: 'ShelterTypeOffsetPaginated', results: Array<{ __typename?: 'ShelterType', id: string, name: string, totalBeds?: number | null, location?: { __typename?: 'ShelterLocationType', place: string } | null }> } };


export const ViewSheltersByOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewSheltersByOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sheltersByOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"place"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalBeds"}}]}}]}}]}}]} as unknown as DocumentNode<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>;
