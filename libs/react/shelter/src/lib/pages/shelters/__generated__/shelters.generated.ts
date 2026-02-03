import type * as Types from '../../../apollo/graphql/__generated__/types';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ViewSheltersQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.ShelterFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  ordering?: Array<Types.ShelterOrder> | Types.ShelterOrder;
}>;


export type ViewSheltersQuery = { __typename?: 'Query', shelters: { __typename?: 'ShelterTypeOffsetPaginated', totalCount: number, results: Array<{ __typename?: 'ShelterType', id: string, name: string, heroImage?: string | null, distanceInMiles?: number | null, exteriorPhotos: Array<{ __typename?: 'ShelterPhotoType', file: { __typename?: 'DjangoFileType', url: string, name: string } }>, interiorPhotos: Array<{ __typename?: 'ShelterPhotoType', file: { __typename?: 'DjangoFileType', url: string, name: string } }>, location?: { __typename?: 'ShelterLocationType', latitude: number, longitude: number, place: string } | null }> } };

export type CreateShelterMutationVariables = Types.Exact<{
  input: Types.CreateShelterInput;
}>;


export type CreateShelterMutation = { __typename?: 'Mutation', createShelter: { __typename?: 'OperationInfo' } | { __typename?: 'ShelterType', id: string, name: string, status: Types.StatusChoices } };


export const ViewSheltersDocument = gql`
    query ViewShelters($filters: ShelterFilter, $pagination: OffsetPaginationInput, $order: ShelterOrder) {
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
export function useViewSheltersQuery(baseOptions?: Apollo.QueryHookOptions<ViewSheltersQuery, ViewSheltersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ViewSheltersQuery, ViewSheltersQueryVariables>(ViewSheltersDocument, options);
      }
export function useViewSheltersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ViewSheltersQuery, ViewSheltersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ViewSheltersQuery, ViewSheltersQueryVariables>(ViewSheltersDocument, options);
        }
export function useViewSheltersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ViewSheltersQuery, ViewSheltersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewSheltersQuery, ViewSheltersQueryVariables>(ViewSheltersDocument, options);
        }
export type ViewSheltersQueryHookResult = ReturnType<typeof useViewSheltersQuery>;
export type ViewSheltersLazyQueryHookResult = ReturnType<typeof useViewSheltersLazyQuery>;
export type ViewSheltersSuspenseQueryHookResult = ReturnType<typeof useViewSheltersSuspenseQuery>;
export type ViewSheltersQueryResult = Apollo.QueryResult<ViewSheltersQuery, ViewSheltersQueryVariables>;
export const CreateShelterDocument = gql`
    mutation CreateShelter($input: CreateShelterInput!) {
  createShelter(input: $input) {
    ... on ShelterType {
      id
      name
      status
    }
  }
}
    `;
export type CreateShelterMutationFn = Apollo.MutationFunction<CreateShelterMutation, CreateShelterMutationVariables>;

/**
 * __useCreateShelterMutation__
 *
 * To run a mutation, you first call `useCreateShelterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateShelterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createShelterMutation, { data, loading, error }] = useCreateShelterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateShelterMutation(baseOptions?: Apollo.MutationHookOptions<CreateShelterMutation, CreateShelterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateShelterMutation, CreateShelterMutationVariables>(CreateShelterDocument, options);
      }
export type CreateShelterMutationHookResult = ReturnType<typeof useCreateShelterMutation>;
export type CreateShelterMutationResult = Apollo.MutationResult<CreateShelterMutation>;
export type CreateShelterMutationOptions = Apollo.BaseMutationOptions<CreateShelterMutation, CreateShelterMutationVariables>;
