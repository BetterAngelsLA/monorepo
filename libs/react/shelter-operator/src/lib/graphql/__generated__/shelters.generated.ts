import * as Types from '../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ViewSheltersByOrganizationQueryVariables = Types.Exact<{
  organizationId: Types.Scalars['ID']['input'];
}>;


export type ViewSheltersByOrganizationQuery = { __typename?: 'Query', sheltersByOrganization: { __typename?: 'ShelterTypeOffsetPaginated', results: Array<{ __typename?: 'ShelterType', id: string, name: string, totalBeds?: number | null, location?: { __typename?: 'ShelterLocationType', place: string } | null }> } };


export const ViewSheltersByOrganizationDocument = gql`
    query ViewSheltersByOrganization($organizationId: ID!) {
  sheltersByOrganization(organizationId: $organizationId) {
    results {
      id
      name
      location {
        place
      }
      totalBeds
    }
  }
}
    `;

/**
 * __useViewSheltersByOrganizationQuery__
 *
 * To run a query within a React component, call `useViewSheltersByOrganizationQuery` and pass it any options that fit your needs.
 * When your component renders, `useViewSheltersByOrganizationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useViewSheltersByOrganizationQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useViewSheltersByOrganizationQuery(baseOptions: Apollo.QueryHookOptions<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables> & ({ variables: ViewSheltersByOrganizationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>(ViewSheltersByOrganizationDocument, options);
      }
export function useViewSheltersByOrganizationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>(ViewSheltersByOrganizationDocument, options);
        }
export function useViewSheltersByOrganizationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>(ViewSheltersByOrganizationDocument, options);
        }
export type ViewSheltersByOrganizationQueryHookResult = ReturnType<typeof useViewSheltersByOrganizationQuery>;
export type ViewSheltersByOrganizationLazyQueryHookResult = ReturnType<typeof useViewSheltersByOrganizationLazyQuery>;
export type ViewSheltersByOrganizationSuspenseQueryHookResult = ReturnType<typeof useViewSheltersByOrganizationSuspenseQuery>;
export type ViewSheltersByOrganizationQueryResult = Apollo.QueryResult<ViewSheltersByOrganizationQuery, ViewSheltersByOrganizationQueryVariables>;