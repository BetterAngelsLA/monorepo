import * as Types from './types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type TasksQueryVariables = Types.Exact<{
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.TaskOrder>;
}>;


export type TasksQuery = { __typename?: 'Query', tasks: Array<{ __typename?: 'TaskType', id: string, title: string, status: Types.TaskStatusEnum, dueBy?: any | null, dueByGroup: Types.DueByGroupEnum, createdAt: any, location?: { __typename?: 'LocationType', id: string, point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } }> };

export type ViewTaskQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewTaskQuery = { __typename?: 'Query', task: { __typename?: 'TaskType', id: string, title: string, status: Types.TaskStatusEnum, dueBy?: any | null, dueByGroup: Types.DueByGroupEnum, createdAt: any, location?: { __typename?: 'LocationType', id: string, point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type NotesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.NoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  order?: Types.InputMaybe<Types.NoteOrder>;
}>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, title: string, publicDetails: string, isSubmitted: boolean, interactedAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string, email: string, username: string, firstName?: string | null, lastName?: string | null } | null, createdBy: { __typename?: 'UserType', id: string, email: string, username: string } }> };

export type ViewNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, isSubmitted: boolean, interactedAt: any, createdAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, attachments: Array<{ __typename?: 'NoteAttachmentType', id: string, namespace: Types.NoteNamespaceEnum, attachmentType: Types.AttachmentType, file: { __typename?: 'DjangoFileType', url: string, name: string } }>, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: Types.MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string, status: Types.TaskStatusEnum, createdAt: any, createdBy: { __typename?: 'UserType', id: string, email: string, username: string } }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string, email: string, firstName?: string | null, lastName?: string | null } | null, createdBy: { __typename?: 'UserType', id: string } } };


export const TasksDocument = gql`
    query Tasks($pagination: OffsetPaginationInput, $order: TaskOrder) {
  tasks(pagination: $pagination, order: $order) {
    id
    title
    location {
      id
      address {
        street
        city
        state
        zipCode
      }
      point
      pointOfInterest
    }
    status
    dueBy
    dueByGroup
    client {
      id
    }
    createdBy {
      id
    }
    createdAt
  }
}
    `;

/**
 * __useTasksQuery__
 *
 * To run a query within a React component, call `useTasksQuery` and pass it any options that fit your needs.
 * When your component renders, `useTasksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTasksQuery({
 *   variables: {
 *      pagination: // value for 'pagination'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useTasksQuery(baseOptions?: Apollo.QueryHookOptions<TasksQuery, TasksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TasksQuery, TasksQueryVariables>(TasksDocument, options);
      }
export function useTasksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TasksQuery, TasksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TasksQuery, TasksQueryVariables>(TasksDocument, options);
        }
export function useTasksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TasksQuery, TasksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TasksQuery, TasksQueryVariables>(TasksDocument, options);
        }
export type TasksQueryHookResult = ReturnType<typeof useTasksQuery>;
export type TasksLazyQueryHookResult = ReturnType<typeof useTasksLazyQuery>;
export type TasksSuspenseQueryHookResult = ReturnType<typeof useTasksSuspenseQuery>;
export type TasksQueryResult = Apollo.QueryResult<TasksQuery, TasksQueryVariables>;
export const ViewTaskDocument = gql`
    query ViewTask($id: ID!) {
  task(pk: $id) {
    id
    title
    location {
      id
      address {
        street
        city
        state
        zipCode
      }
      point
      pointOfInterest
    }
    status
    dueBy
    dueByGroup
    client {
      id
    }
    createdBy {
      id
    }
    createdAt
  }
}
    `;

/**
 * __useViewTaskQuery__
 *
 * To run a query within a React component, call `useViewTaskQuery` and pass it any options that fit your needs.
 * When your component renders, `useViewTaskQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useViewTaskQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useViewTaskQuery(baseOptions: Apollo.QueryHookOptions<ViewTaskQuery, ViewTaskQueryVariables> & ({ variables: ViewTaskQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ViewTaskQuery, ViewTaskQueryVariables>(ViewTaskDocument, options);
      }
export function useViewTaskLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ViewTaskQuery, ViewTaskQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ViewTaskQuery, ViewTaskQueryVariables>(ViewTaskDocument, options);
        }
export function useViewTaskSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ViewTaskQuery, ViewTaskQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewTaskQuery, ViewTaskQueryVariables>(ViewTaskDocument, options);
        }
export type ViewTaskQueryHookResult = ReturnType<typeof useViewTaskQuery>;
export type ViewTaskLazyQueryHookResult = ReturnType<typeof useViewTaskLazyQuery>;
export type ViewTaskSuspenseQueryHookResult = ReturnType<typeof useViewTaskSuspenseQuery>;
export type ViewTaskQueryResult = Apollo.QueryResult<ViewTaskQuery, ViewTaskQueryVariables>;
export const NotesDocument = gql`
    query Notes($filters: NoteFilter, $pagination: OffsetPaginationInput, $order: NoteOrder) {
  notes(filters: $filters, pagination: $pagination, order: $order) {
    id
    title
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
    purposes {
      id
      title
    }
    nextSteps {
      id
      title
    }
    providedServices {
      id
      service
      customService
    }
    requestedServices {
      id
      service
      customService
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
    title
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
    purposes {
      id
      title
      status
      createdAt
      createdBy {
        id
        email
        username
      }
    }
    nextSteps {
      id
      title
    }
    providedServices {
      id
      service
      customService
    }
    requestedServices {
      id
      service
      customService
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