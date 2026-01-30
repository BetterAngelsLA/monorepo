import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CurrentOrgUserQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type CurrentOrgUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'UserType', id: string, username: string, firstName?: any | null, lastName?: any | null, email?: any | null, organizations?: Array<{ __typename?: 'OrganizationForUserType', id: string, name: string, userPermissions?: Array<Types.UserOrganizationPermissions> | null }> | null } };


export const CurrentOrgUserDocument = gql`
    query currentOrgUser {
  currentUser {
    id
    username
    firstName
    lastName
    email
    organizations: organizationsOrganization {
      id
      name
      userPermissions
    }
  }
}
    `;

/**
 * __useCurrentOrgUserQuery__
 *
 * To run a query within a React component, call `useCurrentOrgUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentOrgUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentOrgUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentOrgUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>(CurrentOrgUserDocument, options);
      }
export function useCurrentOrgUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>(CurrentOrgUserDocument, options);
        }
export function useCurrentOrgUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>(CurrentOrgUserDocument, options);
        }
export type CurrentOrgUserQueryHookResult = ReturnType<typeof useCurrentOrgUserQuery>;
export type CurrentOrgUserLazyQueryHookResult = ReturnType<typeof useCurrentOrgUserLazyQuery>;
export type CurrentOrgUserSuspenseQueryHookResult = ReturnType<typeof useCurrentOrgUserSuspenseQuery>;
export type CurrentOrgUserQueryResult = Apollo.QueryResult<CurrentOrgUserQuery, CurrentOrgUserQueryVariables>;