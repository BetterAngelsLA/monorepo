import * as Types from './types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type NotesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.NoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.NoteOrder>;
}>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, purpose?: string | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: string | null, username: string, firstName?: string | null, lastName?: string | null } | null, createdBy: { __typename?: 'UserType', id: string, email?: string | null, username: string, firstName?: string | null, lastName?: string | null } }> };

export type ViewNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, purpose?: string | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, createdAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, attachments: Array<{ __typename?: 'NoteAttachmentType', id: string, namespace: Types.NoteNamespaceEnum, attachmentType: Types.AttachmentType, file: { __typename?: 'DjangoFileType', url: string, name: string } }>, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type SearchPlacesQueryVariables = Types.Exact<{
  input: Types.PlaceAutocompleteInput;
}>;


export type SearchPlacesQuery = { __typename?: 'Query', searchPlaces: { __typename?: 'PlaceAutocompleteResponse', status: Types.PlacesAutocompleteStatus, errorMessage?: string | null, infoMessages?: Array<string> | null, predictions: Array<{ __typename?: 'PlaceAutocompletePrediction', description: string, placeId: string, distanceMeters?: number | null, types?: Array<string> | null, matchedSubstrings: Array<{ __typename?: 'PlaceAutocompleteMatchedSubstring', length: number, offset: number }>, structuredFormatting: { __typename?: 'PlaceAutocompleteStructuredFormat', mainText: string, secondaryText?: string | null }, terms: Array<{ __typename?: 'PlaceAutocompleteTerm', offset: number, value: string }> }> } };


export const NotesDocument = gql`
    query Notes($filters: NoteFilter, $pagination: OffsetPaginationInput, $order: NoteOrder) {
  notes(filters: $filters, pagination: $pagination, order: $order) {
    id
    purpose
    location {
      address {
        id
        street
        city
        state
        zipCode
      }
      point
      pointOfInterest
    }
    moods {
      id
      descriptor
    }
    providedServices {
      id
      service
      serviceOther
    }
    requestedServices {
      id
      service
      serviceOther
    }
    publicDetails
    isSubmitted
    client {
      id
      email
      username
      firstName
      lastName
    }
    createdBy {
      id
      email
      username
      firstName
      lastName
    }
    interactedAt
  }
}
    `;

/**
 * __useNotesQuery__
 *
 * To run a query within a React component, call `useNotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotesQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useNotesQuery(baseOptions?: Apollo.QueryHookOptions<NotesQuery, NotesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NotesQuery, NotesQueryVariables>(NotesDocument, options);
      }
export function useNotesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NotesQuery, NotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NotesQuery, NotesQueryVariables>(NotesDocument, options);
        }
export function useNotesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<NotesQuery, NotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NotesQuery, NotesQueryVariables>(NotesDocument, options);
        }
export type NotesQueryHookResult = ReturnType<typeof useNotesQuery>;
export type NotesLazyQueryHookResult = ReturnType<typeof useNotesLazyQuery>;
export type NotesSuspenseQueryHookResult = ReturnType<typeof useNotesSuspenseQuery>;
export type NotesQueryResult = Apollo.QueryResult<NotesQuery, NotesQueryVariables>;
export const ViewNoteDocument = gql`
    query ViewNote($id: ID!) {
  note(pk: $id) {
    id
    purpose
    location {
      address {
        id
        street
        city
        state
        zipCode
      }
      point
      pointOfInterest
    }
    attachments {
      id
      namespace
      attachmentType
      file {
        url
        name
      }
    }
    moods {
      id
      descriptor
    }
    providedServices {
      id
      service
      serviceOther
    }
    requestedServices {
      id
      service
      serviceOther
    }
    publicDetails
    isSubmitted
    client {
      id
      email
      firstName
      lastName
    }
    createdBy {
      id
    }
    interactedAt
    createdAt
  }
}
    `;

/**
 * __useViewNoteQuery__
 *
 * To run a query within a React component, call `useViewNoteQuery` and pass it any options that fit your needs.
 * When your component renders, `useViewNoteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useViewNoteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useViewNoteQuery(baseOptions: Apollo.QueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables> & ({ variables: ViewNoteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
      }
export function useViewNoteLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
        }
export function useViewNoteSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
        }
export type ViewNoteQueryHookResult = ReturnType<typeof useViewNoteQuery>;
export type ViewNoteLazyQueryHookResult = ReturnType<typeof useViewNoteLazyQuery>;
export type ViewNoteSuspenseQueryHookResult = ReturnType<typeof useViewNoteSuspenseQuery>;
export type ViewNoteQueryResult = Apollo.QueryResult<ViewNoteQuery, ViewNoteQueryVariables>;
export const SearchPlacesDocument = gql`
    query SearchPlaces($input: PlaceAutocompleteInput!) {
  searchPlaces(input: $input) @rest(type: "PlaceAutocompleteResponse", path: "/place/autocomplete/json?input={args.input.input}&components={args.input.components}&language={args.input.language}&location={args.input.location}&locationbias={args.input.locationbias}&locationrestriction={args.input.locationrestriction}&offset={args.input.offset}&origin={args.input.origin}&radius={args.input.radius}&region={args.input.region}&sessiontoken={args.input.sessiontoken}&strictbounds={args.input.strictbounds}&types={args.input.types}") {
    predictions {
      description
      placeId
      matchedSubstrings {
        length
        offset
      }
      structuredFormatting {
        mainText
        secondaryText
      }
      terms {
        offset
        value
      }
      distanceMeters
      types
    }
    status
    errorMessage
    infoMessages
  }
}
    `;

/**
 * __useSearchPlacesQuery__
 *
 * To run a query within a React component, call `useSearchPlacesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchPlacesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchPlacesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchPlacesQuery(baseOptions: Apollo.QueryHookOptions<SearchPlacesQuery, SearchPlacesQueryVariables> & ({ variables: SearchPlacesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchPlacesQuery, SearchPlacesQueryVariables>(SearchPlacesDocument, options);
      }
export function useSearchPlacesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchPlacesQuery, SearchPlacesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchPlacesQuery, SearchPlacesQueryVariables>(SearchPlacesDocument, options);
        }
export function useSearchPlacesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchPlacesQuery, SearchPlacesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchPlacesQuery, SearchPlacesQueryVariables>(SearchPlacesDocument, options);
        }
export type SearchPlacesQueryHookResult = ReturnType<typeof useSearchPlacesQuery>;
export type SearchPlacesLazyQueryHookResult = ReturnType<typeof useSearchPlacesLazyQuery>;
export type SearchPlacesSuspenseQueryHookResult = ReturnType<typeof useSearchPlacesSuspenseQuery>;
export type SearchPlacesQueryResult = Apollo.QueryResult<SearchPlacesQuery, SearchPlacesQueryVariables>;