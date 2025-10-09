import * as Types from './types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DeleteCurrentUserMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type DeleteCurrentUserMutation = { __typename?: 'Mutation', deleteCurrentUser: { __typename?: 'DeletedObjectType', id: number } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type UpdateNoteMutationVariables = Types.Exact<{
  data: Types.UpdateNoteInput;
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote: { __typename?: 'NoteType', id: string, purpose?: string | null, publicDetails: string, createdAt: any, clientProfile?: { __typename?: 'ClientProfileType', id: string, firstName?: string | null, lastName?: string | null, email?: string | null } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email?: string | null } } | { __typename?: 'OperationInfo' } };

export type RevertNoteMutationVariables = Types.Exact<{
  data: Types.RevertNoteInput;
}>;


export type RevertNoteMutation = { __typename?: 'Mutation', revertNote: { __typename?: 'NoteType', id: string, purpose?: string | null, publicDetails: string, isSubmitted: boolean, interactedAt: any, createdAt: any, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, serviceEnum?: Types.ServiceEnum | null, serviceOther?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, serviceEnum?: Types.ServiceEnum | null, serviceOther?: string | null }>, clientProfile?: { __typename?: 'ClientProfileType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } | { __typename?: 'OperationInfo' } };

export type DeleteNoteMutationVariables = Types.Exact<{
  data: Types.DeleteDjangoObjectInput;
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote: { __typename?: 'NoteType', id: string } | { __typename?: 'OperationInfo' } };

export type CreateNoteServiceRequestMutationVariables = Types.Exact<{
  data: Types.CreateNoteServiceRequestInput;
}>;


export type CreateNoteServiceRequestMutation = { __typename?: 'Mutation', createNoteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string, serviceEnum?: Types.ServiceEnum | null } };

export type DeleteServiceRequestMutationVariables = Types.Exact<{
  data: Types.DeleteDjangoObjectInput;
}>;


export type DeleteServiceRequestMutation = { __typename?: 'Mutation', deleteServiceRequest: { __typename?: 'DeletedObjectType', id: number } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };

export type UpdateNoteLocationMutationVariables = Types.Exact<{
  data: Types.UpdateNoteLocationInput;
}>;


export type UpdateNoteLocationMutation = { __typename?: 'Mutation', updateNoteLocation: { __typename?: 'NoteType', id: string, location?: { __typename?: 'LocationType', point: any, pointOfInterest?: string | null, address: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } } | null } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


export const DeleteCurrentUserDocument = gql`
    mutation DeleteCurrentUser {
  deleteCurrentUser {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on DeletedObjectType {
      id
    }
  }
}
    `;
export type DeleteCurrentUserMutationFn = Apollo.MutationFunction<DeleteCurrentUserMutation, DeleteCurrentUserMutationVariables>;

/**
 * __useDeleteCurrentUserMutation__
 *
 * To run a mutation, you first call `useDeleteCurrentUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCurrentUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCurrentUserMutation, { data, loading, error }] = useDeleteCurrentUserMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteCurrentUserMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCurrentUserMutation, DeleteCurrentUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCurrentUserMutation, DeleteCurrentUserMutationVariables>(DeleteCurrentUserDocument, options);
      }
export type DeleteCurrentUserMutationHookResult = ReturnType<typeof useDeleteCurrentUserMutation>;
export type DeleteCurrentUserMutationResult = Apollo.MutationResult<DeleteCurrentUserMutation>;
export type DeleteCurrentUserMutationOptions = Apollo.BaseMutationOptions<DeleteCurrentUserMutation, DeleteCurrentUserMutationVariables>;
export const UpdateNoteDocument = gql`
    mutation UpdateNote($data: UpdateNoteInput!) {
  updateNote(data: $data) {
    ... on NoteType {
      id
      purpose
      publicDetails
      clientProfile {
        id
        firstName
        lastName
        email
      }
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
}
    `;
export type UpdateNoteMutationFn = Apollo.MutationFunction<UpdateNoteMutation, UpdateNoteMutationVariables>;

/**
 * __useUpdateNoteMutation__
 *
 * To run a mutation, you first call `useUpdateNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNoteMutation, { data, loading, error }] = useUpdateNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateNoteMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNoteMutation, UpdateNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNoteMutation, UpdateNoteMutationVariables>(UpdateNoteDocument, options);
      }
export type UpdateNoteMutationHookResult = ReturnType<typeof useUpdateNoteMutation>;
export type UpdateNoteMutationResult = Apollo.MutationResult<UpdateNoteMutation>;
export type UpdateNoteMutationOptions = Apollo.BaseMutationOptions<UpdateNoteMutation, UpdateNoteMutationVariables>;
export const RevertNoteDocument = gql`
    mutation RevertNote($data: RevertNoteInput!) {
  revertNote(data: $data) {
    ... on NoteType {
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
      providedServices {
        id
        serviceEnum
        serviceOther
      }
      requestedServices {
        id
        serviceEnum
        serviceOther
      }
      publicDetails
      isSubmitted
      clientProfile {
        id
      }
      createdBy {
        id
      }
      interactedAt
      createdAt
    }
  }
}
    `;
export type RevertNoteMutationFn = Apollo.MutationFunction<RevertNoteMutation, RevertNoteMutationVariables>;

/**
 * __useRevertNoteMutation__
 *
 * To run a mutation, you first call `useRevertNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRevertNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [revertNoteMutation, { data, loading, error }] = useRevertNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useRevertNoteMutation(baseOptions?: Apollo.MutationHookOptions<RevertNoteMutation, RevertNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RevertNoteMutation, RevertNoteMutationVariables>(RevertNoteDocument, options);
      }
export type RevertNoteMutationHookResult = ReturnType<typeof useRevertNoteMutation>;
export type RevertNoteMutationResult = Apollo.MutationResult<RevertNoteMutation>;
export type RevertNoteMutationOptions = Apollo.BaseMutationOptions<RevertNoteMutation, RevertNoteMutationVariables>;
export const DeleteNoteDocument = gql`
    mutation DeleteNote($data: DeleteDjangoObjectInput!) {
  deleteNote(data: $data) {
    ... on NoteType {
      id
    }
  }
}
    `;
export type DeleteNoteMutationFn = Apollo.MutationFunction<DeleteNoteMutation, DeleteNoteMutationVariables>;

/**
 * __useDeleteNoteMutation__
 *
 * To run a mutation, you first call `useDeleteNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNoteMutation, { data, loading, error }] = useDeleteNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteNoteMutation(baseOptions?: Apollo.MutationHookOptions<DeleteNoteMutation, DeleteNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteNoteMutation, DeleteNoteMutationVariables>(DeleteNoteDocument, options);
      }
export type DeleteNoteMutationHookResult = ReturnType<typeof useDeleteNoteMutation>;
export type DeleteNoteMutationResult = Apollo.MutationResult<DeleteNoteMutation>;
export type DeleteNoteMutationOptions = Apollo.BaseMutationOptions<DeleteNoteMutation, DeleteNoteMutationVariables>;
export const CreateNoteServiceRequestDocument = gql`
    mutation CreateNoteServiceRequest($data: CreateNoteServiceRequestInput!) {
  createNoteServiceRequest(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on ServiceRequestType {
      id
      serviceEnum
    }
  }
}
    `;
export type CreateNoteServiceRequestMutationFn = Apollo.MutationFunction<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>;

/**
 * __useCreateNoteServiceRequestMutation__
 *
 * To run a mutation, you first call `useCreateNoteServiceRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteServiceRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteServiceRequestMutation, { data, loading, error }] = useCreateNoteServiceRequestMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteServiceRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>(CreateNoteServiceRequestDocument, options);
      }
export type CreateNoteServiceRequestMutationHookResult = ReturnType<typeof useCreateNoteServiceRequestMutation>;
export type CreateNoteServiceRequestMutationResult = Apollo.MutationResult<CreateNoteServiceRequestMutation>;
export type CreateNoteServiceRequestMutationOptions = Apollo.BaseMutationOptions<CreateNoteServiceRequestMutation, CreateNoteServiceRequestMutationVariables>;
export const DeleteServiceRequestDocument = gql`
    mutation DeleteServiceRequest($data: DeleteDjangoObjectInput!) {
  deleteServiceRequest(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on DeletedObjectType {
      id
    }
  }
}
    `;
export type DeleteServiceRequestMutationFn = Apollo.MutationFunction<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>;

/**
 * __useDeleteServiceRequestMutation__
 *
 * To run a mutation, you first call `useDeleteServiceRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteServiceRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteServiceRequestMutation, { data, loading, error }] = useDeleteServiceRequestMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteServiceRequestMutation(baseOptions?: Apollo.MutationHookOptions<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>(DeleteServiceRequestDocument, options);
      }
export type DeleteServiceRequestMutationHookResult = ReturnType<typeof useDeleteServiceRequestMutation>;
export type DeleteServiceRequestMutationResult = Apollo.MutationResult<DeleteServiceRequestMutation>;
export type DeleteServiceRequestMutationOptions = Apollo.BaseMutationOptions<DeleteServiceRequestMutation, DeleteServiceRequestMutationVariables>;
export const UpdateNoteLocationDocument = gql`
    mutation UpdateNoteLocation($data: UpdateNoteLocationInput!) {
  updateNoteLocation(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteType {
      id
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
    }
  }
}
    `;
export type UpdateNoteLocationMutationFn = Apollo.MutationFunction<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>;

/**
 * __useUpdateNoteLocationMutation__
 *
 * To run a mutation, you first call `useUpdateNoteLocationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNoteLocationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNoteLocationMutation, { data, loading, error }] = useUpdateNoteLocationMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateNoteLocationMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>(UpdateNoteLocationDocument, options);
      }
export type UpdateNoteLocationMutationHookResult = ReturnType<typeof useUpdateNoteLocationMutation>;
export type UpdateNoteLocationMutationResult = Apollo.MutationResult<UpdateNoteLocationMutation>;
export type UpdateNoteLocationMutationOptions = Apollo.BaseMutationOptions<UpdateNoteLocationMutation, UpdateNoteLocationMutationVariables>;