import * as Types from '../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type InteractionAuthorsQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.InteractionAuthorFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
}>;


export type InteractionAuthorsQuery = { __typename?: 'Query', interactionAuthors: { __typename?: 'InteractionAuthorTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'InteractionAuthorType', firstName?: string | null, id: string, lastName?: string | null, middleName?: string | null }>, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number } } };


export const InteractionAuthorsDocument = gql`
    query InteractionAuthors($filters: InteractionAuthorFilter, $pagination: OffsetPaginationInput) {
  interactionAuthors(filters: $filters, pagination: $pagination) {
    totalCount
    results {
      firstName
      id
      lastName
      middleName
    }
    pageInfo {
      limit
      offset
    }
  }
}
    `;

/**
 * __useInteractionAuthorsQuery__
 *
 * To run a query within a React component, call `useInteractionAuthorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useInteractionAuthorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useInteractionAuthorsQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useInteractionAuthorsQuery(baseOptions?: Apollo.QueryHookOptions<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>(InteractionAuthorsDocument, options);
      }
export function useInteractionAuthorsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>(InteractionAuthorsDocument, options);
        }
export function useInteractionAuthorsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>(InteractionAuthorsDocument, options);
        }
export type InteractionAuthorsQueryHookResult = ReturnType<typeof useInteractionAuthorsQuery>;
export type InteractionAuthorsLazyQueryHookResult = ReturnType<typeof useInteractionAuthorsLazyQuery>;
export type InteractionAuthorsSuspenseQueryHookResult = ReturnType<typeof useInteractionAuthorsSuspenseQuery>;
export type InteractionAuthorsQueryResult = Apollo.QueryResult<InteractionAuthorsQuery, InteractionAuthorsQueryVariables>;