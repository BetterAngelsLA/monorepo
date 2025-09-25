import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ServiceCategoriesQueryVariables = Types.Exact<{
  ordering?: Array<Types.OrganizationServiceCategoryOrdering> | Types.OrganizationServiceCategoryOrdering;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type ServiceCategoriesQuery = { __typename?: 'Query', serviceCategories: { __typename?: 'OrganizationServiceCategoryTypeOffsetPaginated', results: Array<{ __typename?: 'OrganizationServiceCategoryType', name: string, priority?: number | null, id: string, services: Array<{ __typename?: 'OrganizationServiceType', label: string, priority?: number | null, id: string }> }> } };


export const ServiceCategoriesDocument = gql`
    query ServiceCategories($ordering: [OrganizationServiceCategoryOrdering!]! = [], $pagination: OffsetPaginationInput) {
  serviceCategories(pagination: $pagination, ordering: $ordering) {
    results {
      services {
        label
        priority
        id
      }
      name
      priority
      id
    }
  }
}
    `;

/**
 * __useServiceCategoriesQuery__
 *
 * To run a query within a React component, call `useServiceCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useServiceCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useServiceCategoriesQuery({
 *   variables: {
 *      ordering: // value for 'ordering'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useServiceCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>(ServiceCategoriesDocument, options);
      }
export function useServiceCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>(ServiceCategoriesDocument, options);
        }
export function useServiceCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>(ServiceCategoriesDocument, options);
        }
export type ServiceCategoriesQueryHookResult = ReturnType<typeof useServiceCategoriesQuery>;
export type ServiceCategoriesLazyQueryHookResult = ReturnType<typeof useServiceCategoriesLazyQuery>;
export type ServiceCategoriesSuspenseQueryHookResult = ReturnType<typeof useServiceCategoriesSuspenseQuery>;
export type ServiceCategoriesQueryResult = Apollo.QueryResult<ServiceCategoriesQuery, ServiceCategoriesQueryVariables>;