import * as Types from '../../../apollo/graphql/__generated__/types';

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
      exteriorPhotos: Array<{
        __typename?: 'ShelterPhotoType';
        file: { __typename?: 'DjangoFileType'; url: string; name: string };
      }>;
      interiorPhotos: Array<{
        __typename?: 'ShelterPhotoType';
        file: { __typename?: 'DjangoFileType'; url: string; name: string };
      }>;
      location?: {
        __typename?: 'ShelterLocationType';
        latitude: number;
        longitude: number;
        place: string;
      } | null;
    }>;
  };
};

export type ViewSheltersByOrganizationQueryVariables = Types.Exact<{
  organizationId: Types.Scalars['ID']['input'];
}>;

export type ViewSheltersByOrganizationQuery = {
  __typename?: 'Query';
  sheltersByOrganization: {
    __typename?: 'ShelterTypeOffsetPaginated';
    results: Array<{
      __typename?: 'ShelterType';
      id: string;
      name: string;
      totalBeds: number;
      location?: {
        __typename?: 'ShelterLocationType';
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
        exteriorPhotos {
          file {
            url
            name
          }
        }
        interiorPhotos {
          file {
            url
            name
          }
        }
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
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ViewSheltersQuery,
        ViewSheltersQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
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
 *   },
 * });
 */
export function useViewSheltersByOrganizationQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ViewSheltersByOrganizationQuery,
    ViewSheltersByOrganizationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    ViewSheltersByOrganizationQuery,
    ViewSheltersByOrganizationQueryVariables
  >(ViewSheltersByOrganizationDocument, options);
}
export function useViewSheltersByOrganizationLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ViewSheltersByOrganizationQuery,
    ViewSheltersByOrganizationQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ViewSheltersByOrganizationQuery,
    ViewSheltersByOrganizationQueryVariables
  >(ViewSheltersByOrganizationDocument, options);
}
export function useViewSheltersByOrganizationSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        ViewSheltersByOrganizationQuery,
        ViewSheltersByOrganizationQueryVariables
      >
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    ViewSheltersByOrganizationQuery,
    ViewSheltersByOrganizationQueryVariables
  >(ViewSheltersByOrganizationDocument, options);
}
export type ViewSheltersByOrganizationQueryHookResult = ReturnType<
  typeof useViewSheltersByOrganizationQuery
>;
export type ViewSheltersByOrganizationLazyQueryHookResult = ReturnType<
  typeof useViewSheltersByOrganizationLazyQuery
>;
export type ViewSheltersByOrganizationSuspenseQueryHookResult = ReturnType<
  typeof useViewSheltersByOrganizationSuspenseQuery
>;
export type ViewSheltersByOrganizationQueryResult = Apollo.QueryResult<
  ViewSheltersByOrganizationQuery,
  ViewSheltersByOrganizationQueryVariables
>;
