import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetFeatureControlsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetFeatureControlsQuery = { __typename?: 'Query', featureControls: { __typename?: 'FeatureControlData', flags: Array<{ __typename?: 'FlagType', isActive?: boolean | null, lastModified?: any | null, name: string }>, samples: Array<{ __typename?: 'SampleType', isActive: boolean, lastModified?: any | null, name: string }>, switches: Array<{ __typename?: 'SwitchType', isActive: boolean, lastModified?: any | null, name: string }> } };


export const GetFeatureControlsDocument = gql`
    query GetFeatureControls {
  featureControls {
    flags {
      isActive
      lastModified
      name
    }
    samples {
      isActive
      lastModified
      name
    }
    switches {
      isActive
      lastModified
      name
    }
  }
}
    `;

/**
 * __useGetFeatureControlsQuery__
 *
 * To run a query within a React component, call `useGetFeatureControlsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeatureControlsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeatureControlsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFeatureControlsQuery(baseOptions?: Apollo.QueryHookOptions<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>(GetFeatureControlsDocument, options);
      }
export function useGetFeatureControlsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>(GetFeatureControlsDocument, options);
        }
export function useGetFeatureControlsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>(GetFeatureControlsDocument, options);
        }
export type GetFeatureControlsQueryHookResult = ReturnType<typeof useGetFeatureControlsQuery>;
export type GetFeatureControlsLazyQueryHookResult = ReturnType<typeof useGetFeatureControlsLazyQuery>;
export type GetFeatureControlsSuspenseQueryHookResult = ReturnType<typeof useGetFeatureControlsSuspenseQuery>;
export type GetFeatureControlsQueryResult = Apollo.QueryResult<GetFeatureControlsQuery, GetFeatureControlsQueryVariables>;