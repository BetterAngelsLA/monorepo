import * as Types from '../../../../../../../expo/betterangels/src/lib/apollo/graphql/__generated__/types';

import * as Apollo from '@apollo/client';
import { gql } from '@apollo/client';
const defaultOptions = {} as const;
export type ViewSheltersQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ShelterFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.ShelterOrder>;
}>;

export type ViewSheltersQuery = {
  __typename?: 'Query';
  shelters: {
    __typename?: 'ShelterTypeOffsetPaginated';
    totalCount: number;
    results: Array<{
      __typename?: 'ShelterType';
      id: string;
      name: string;
      heroImage?: string | null;
      distanceInMiles?: number | null;
      location?: {
        __typename?: 'ShelterLocationType';
        latitude: number;
        longitude: number;
        place: string;
      } | null;
    }>;
  };
};

export const ViewSheltersDocument = gql`
  query ViewShelters(
    $filters: ShelterFilter
    $pagination: OffsetPaginationInput
    $order: ShelterOrder
  ) {
    shelters(filters: $filters, pagination: $pagination, order: $order) {
      totalCount
      results {
        id
        name
        heroImage
        distanceInMiles
        location {
          latitude
          longitude
          place
        }
      }
    }
  }
`;

/**
 * __useViewSheltersQuery__
 *
 * To run a query within a React component, call `useViewSheltersQuery` and pass it any options that fit your needs.
 * When your component renders, `useViewSheltersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useViewSheltersQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useViewSheltersQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ViewSheltersQuery,
    ViewSheltersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ViewSheltersQuery, ViewSheltersQueryVariables>(
    ViewSheltersDocument,
    options
  );
}
export function useViewSheltersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ViewSheltersQuery,
    ViewSheltersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ViewSheltersQuery, ViewSheltersQueryVariables>(
    ViewSheltersDocument,
    options
  );
}
export function useViewSheltersSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    ViewSheltersQuery,
    ViewSheltersQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<ViewSheltersQuery, ViewSheltersQueryVariables>(
    ViewSheltersDocument,
    options
  );
}
export type ViewSheltersQueryHookResult = ReturnType<
  typeof useViewSheltersQuery
>;
export type ViewSheltersLazyQueryHookResult = ReturnType<
  typeof useViewSheltersLazyQuery
>;
export type ViewSheltersSuspenseQueryHookResult = ReturnType<
  typeof useViewSheltersSuspenseQuery
>;
export type ViewSheltersQueryResult = Apollo.QueryResult<
  ViewSheltersQuery,
  ViewSheltersQueryVariables
>;
