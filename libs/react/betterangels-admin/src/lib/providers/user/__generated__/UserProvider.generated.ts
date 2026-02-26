import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CurrentOrgUserQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type CurrentOrgUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'CurrentUserType', id: string, username?: string | null, firstName?: string | null, lastName?: string | null, email?: string | null, organizations?: Array<{ __typename?: 'CurrentUserOrganizationType', id: string, name: string, userPermissions?: Array<Types.UserOrganizationPermissions> | null }> | null } };


export const CurrentOrgUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"currentOrgUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","alias":{"kind":"Name","value":"organizations"},"name":{"kind":"Name","value":"organizationsOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"userPermissions"}}]}}]}}]}}]} as unknown as DocumentNode<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>;