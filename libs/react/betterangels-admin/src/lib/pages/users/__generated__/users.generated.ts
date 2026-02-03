import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type OrganizationMembersQueryVariables = Types.Exact<{
  organizationId: Types.Scalars['String']['input'];
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type OrganizationMembersQuery = { __typename?: 'Query', organizationMembers: { __typename?: 'OrganizationMemberTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'OrganizationMemberType', email?: any | null, firstName?: any | null, id: string, lastLogin?: any | null, lastName?: any | null, memberRole: Types.OrgRoleEnum, middleName?: any | null }> } };


export const OrganizationMembersDocument = gql`
    query OrganizationMembers($organizationId: String!, $pagination: OffsetPaginationInput) {
  organizationMembers(organizationId: $organizationId, pagination: $pagination) {
    totalCount
    results {
      email
      firstName
      id
      lastLogin
      lastName
      memberRole
      middleName
    }
  }
}
    `;

/**
 * __useOrganizationMembersQuery__
 *
 * To run a query within a React component, call `useOrganizationMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrganizationMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrganizationMembersQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useOrganizationMembersQuery(baseOptions: Apollo.QueryHookOptions<OrganizationMembersQuery, OrganizationMembersQueryVariables> & ({ variables: OrganizationMembersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OrganizationMembersQuery, OrganizationMembersQueryVariables>(OrganizationMembersDocument, options);
      }
export function useOrganizationMembersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OrganizationMembersQuery, OrganizationMembersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OrganizationMembersQuery, OrganizationMembersQueryVariables>(OrganizationMembersDocument, options);
        }
export function useOrganizationMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OrganizationMembersQuery, OrganizationMembersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<OrganizationMembersQuery, OrganizationMembersQueryVariables>(OrganizationMembersDocument, options);
        }
export type OrganizationMembersQueryHookResult = ReturnType<typeof useOrganizationMembersQuery>;
export type OrganizationMembersLazyQueryHookResult = ReturnType<typeof useOrganizationMembersLazyQuery>;
export type OrganizationMembersSuspenseQueryHookResult = ReturnType<typeof useOrganizationMembersSuspenseQuery>;
export type OrganizationMembersQueryResult = Apollo.QueryResult<OrganizationMembersQuery, OrganizationMembersQueryVariables>;