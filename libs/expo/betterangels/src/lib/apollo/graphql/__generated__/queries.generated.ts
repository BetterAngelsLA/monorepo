import * as Types from './types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type NotesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.NoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.NoteOrder>;
}>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, purpose?: string | null, team?: Types.SelahTeamEnum | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: string | null, username: string, firstName?: string | null, lastName?: string | null } | null, createdBy: { __typename?: 'UserType', id: string, email?: string | null, username: string, firstName?: string | null, lastName?: string | null } }> };

export type ViewNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, purpose?: string | null, team?: Types.SelahTeamEnum | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, createdAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, attachments: Array<{ __typename?: 'NoteAttachmentType', id: string, namespace: Types.NoteNamespaceEnum, attachmentType: Types.AttachmentType, file: { __typename?: 'DjangoFileType', url: string, name: string } }>, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, serviceOther?: string | null }>, client?: { __typename?: 'UserType', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, clientProfile?: { __typename?: 'DjangoModelType', id: string } | null } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type GetFeatureFlagsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetFeatureFlagsQuery = { __typename?: 'Query', featureControls: { __typename?: 'FeatureControlData', flags: Array<{ __typename?: 'FlagType', name: string, isActive?: boolean | null, lastModified?: any | null }> } };


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
export function useViewNoteSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ViewNoteQuery, ViewNoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewNoteQuery, ViewNoteQueryVariables>(ViewNoteDocument, options);
        }
export type ViewNoteQueryHookResult = ReturnType<typeof useViewNoteQuery>;
export type ViewNoteLazyQueryHookResult = ReturnType<typeof useViewNoteLazyQuery>;
export type ViewNoteSuspenseQueryHookResult = ReturnType<typeof useViewNoteSuspenseQuery>;
export type ViewNoteQueryResult = Apollo.QueryResult<ViewNoteQuery, ViewNoteQueryVariables>;
export const GetFeatureFlagsDocument = gql`
    query GetFeatureFlags {
  featureControls {
    flags {
      name
      isActive
      lastModified
    }
  }
}
    `;

/**
 * __useGetFeatureFlagsQuery__
 *
 * To run a query within a React component, call `useGetFeatureFlagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFeatureFlagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFeatureFlagsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFeatureFlagsQuery(baseOptions?: Apollo.QueryHookOptions<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>(GetFeatureFlagsDocument, options);
      }
export function useGetFeatureFlagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>(GetFeatureFlagsDocument, options);
        }
export function useGetFeatureFlagsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>(GetFeatureFlagsDocument, options);
        }
export type GetFeatureFlagsQueryHookResult = ReturnType<typeof useGetFeatureFlagsQuery>;
export type GetFeatureFlagsLazyQueryHookResult = ReturnType<typeof useGetFeatureFlagsLazyQuery>;
export type GetFeatureFlagsSuspenseQueryHookResult = ReturnType<typeof useGetFeatureFlagsSuspenseQuery>;
export type GetFeatureFlagsQueryResult = Apollo.QueryResult<GetFeatureFlagsQuery, GetFeatureFlagsQueryVariables>;