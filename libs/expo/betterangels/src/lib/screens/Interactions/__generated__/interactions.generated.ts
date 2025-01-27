import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type AvailableTeamsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type AvailableTeamsQuery = { __typename?: 'Query', availableTeams: Array<Types.SelahTeamEnum> };


export const AvailableTeamsDocument = gql`
    query AvailableTeams {
  availableTeams
}
    `;

/**
 * __useAvailableTeamsQuery__
 *
 * To run a query within a React component, call `useAvailableTeamsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAvailableTeamsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAvailableTeamsQuery({
 *   variables: {
 *   },
 * });
 */
export function useAvailableTeamsQuery(baseOptions?: Apollo.QueryHookOptions<AvailableTeamsQuery, AvailableTeamsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AvailableTeamsQuery, AvailableTeamsQueryVariables>(AvailableTeamsDocument, options);
      }
export function useAvailableTeamsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AvailableTeamsQuery, AvailableTeamsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AvailableTeamsQuery, AvailableTeamsQueryVariables>(AvailableTeamsDocument, options);
        }
export function useAvailableTeamsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AvailableTeamsQuery, AvailableTeamsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AvailableTeamsQuery, AvailableTeamsQueryVariables>(AvailableTeamsDocument, options);
        }
export type AvailableTeamsQueryHookResult = ReturnType<typeof useAvailableTeamsQuery>;
export type AvailableTeamsLazyQueryHookResult = ReturnType<typeof useAvailableTeamsLazyQuery>;
export type AvailableTeamsSuspenseQueryHookResult = ReturnType<typeof useAvailableTeamsSuspenseQuery>;
export type AvailableTeamsQueryResult = Apollo.QueryResult<AvailableTeamsQuery, AvailableTeamsQueryVariables>;