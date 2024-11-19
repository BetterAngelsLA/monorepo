import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ClientCaliforniaUniqueCheckQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ClientProfileFilter>;
}>;


export type ClientCaliforniaUniqueCheckQuery = { __typename?: 'Query', clientProfiles: Array<{ __typename?: 'ClientProfileType', id: string }> };


export const ClientCaliforniaUniqueCheckDocument = gql`
    query ClientCaliforniaUniqueCheck($filters: ClientProfileFilter) {
  clientProfiles(filters: $filters) {
    ... on ClientProfileType {
      id
    }
  }
}
    `;

/**
 * __useClientCaliforniaUniqueCheckQuery__
 *
 * To run a query within a React component, call `useClientCaliforniaUniqueCheckQuery` and pass it any options that fit your needs.
 * When your component renders, `useClientCaliforniaUniqueCheckQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useClientCaliforniaUniqueCheckQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *   },
 * });
 */
export function useClientCaliforniaUniqueCheckQuery(baseOptions?: Apollo.QueryHookOptions<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>(ClientCaliforniaUniqueCheckDocument, options);
      }
export function useClientCaliforniaUniqueCheckLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>(ClientCaliforniaUniqueCheckDocument, options);
        }
export function useClientCaliforniaUniqueCheckSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>(ClientCaliforniaUniqueCheckDocument, options);
        }
export type ClientCaliforniaUniqueCheckQueryHookResult = ReturnType<typeof useClientCaliforniaUniqueCheckQuery>;
export type ClientCaliforniaUniqueCheckLazyQueryHookResult = ReturnType<typeof useClientCaliforniaUniqueCheckLazyQuery>;
export type ClientCaliforniaUniqueCheckSuspenseQueryHookResult = ReturnType<typeof useClientCaliforniaUniqueCheckSuspenseQuery>;
export type ClientCaliforniaUniqueCheckQueryResult = Apollo.QueryResult<ClientCaliforniaUniqueCheckQuery, ClientCaliforniaUniqueCheckQueryVariables>;