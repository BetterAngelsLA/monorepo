import * as Types from './types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type NotesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.NoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.NoteOrder>;
}>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, purpose?: string | null, team?: Types.SelahTeamEnum | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: any | null, username: string, firstName?: any | null, lastName?: any | null } | null, createdBy: { __typename?: 'UserType', id: string, email?: any | null, username: string, firstName?: any | null, lastName?: any | null } }> };

export type ViewNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, purpose?: string | null, team?: Types.SelahTeamEnum | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, createdAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: any | null, firstName?: any | null, lastName?: any | null, clientProfile?: { __typename?: 'DjangoModelType', id: string } | null } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type NotesPaginatedQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.NoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.NoteOrder>;
}>;


export type NotesPaginatedQuery = { __typename?: 'Query', notesPaginated: { __typename?: 'NoteTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number }, results: Array<{ __typename?: 'NoteType', id: string, purpose?: string | null, team?: Types.SelahTeamEnum | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: any | null, username: string, firstName?: any | null, lastName?: any | null } | null, createdBy: { __typename?: 'UserType', id: string, email?: any | null, username: string, firstName?: any | null, lastName?: any | null } }> } };


export const NotesDocument = gql`
    query Notes($filters: NoteFilter, $pagination: OffsetPaginationInput, $order: NoteOrder) {
  notes(filters: $filters, pagination: $pagination, order: $order) {
    id
    purpose
    team
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
export function useNotesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NotesQuery, NotesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
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
    team
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
      firstName
      lastName
      clientProfile {
        id: pk
      }
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
export function useViewNoteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
        }
export type ViewNoteQueryHookResult = ReturnType<typeof useViewNoteQuery>;
export type ViewNoteLazyQueryHookResult = ReturnType<typeof useViewNoteLazyQuery>;
export type ViewNoteSuspenseQueryHookResult = ReturnType<typeof useViewNoteSuspenseQuery>;
export type ViewNoteQueryResult = Apollo.QueryResult<ViewNoteQuery, ViewNoteQueryVariables>;
export const NotesPaginatedDocument = gql`
    query NotesPaginated($filters: NoteFilter, $pagination: OffsetPaginationInput, $order: NoteOrder) {
  notesPaginated(filters: $filters, pagination: $pagination, order: $order) {
    totalCount
    pageInfo {
      limit
      offset
    }
    results {
      id
      purpose
      team
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
}
    `;

/**
 * __useNotesPaginatedQuery__
 *
 * To run a query within a React component, call `useNotesPaginatedQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotesPaginatedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotesPaginatedQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useNotesPaginatedQuery(baseOptions?: Apollo.QueryHookOptions<NotesPaginatedQuery, NotesPaginatedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NotesPaginatedQuery, NotesPaginatedQueryVariables>(NotesPaginatedDocument, options);
      }
export function useNotesPaginatedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NotesPaginatedQuery, NotesPaginatedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NotesPaginatedQuery, NotesPaginatedQueryVariables>(NotesPaginatedDocument, options);
        }
export function useNotesPaginatedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NotesPaginatedQuery, NotesPaginatedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NotesPaginatedQuery, NotesPaginatedQueryVariables>(NotesPaginatedDocument, options);
        }
export type NotesPaginatedQueryHookResult = ReturnType<typeof useNotesPaginatedQuery>;
export type NotesPaginatedLazyQueryHookResult = ReturnType<typeof useNotesPaginatedLazyQuery>;
export type NotesPaginatedSuspenseQueryHookResult = ReturnType<typeof useNotesPaginatedSuspenseQuery>;
export type NotesPaginatedQueryResult = Apollo.QueryResult<NotesPaginatedQuery, NotesPaginatedQueryVariables>;