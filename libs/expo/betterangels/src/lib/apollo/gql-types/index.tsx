import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GenerateMagicLinkMutationVariables = Exact<{ [key: string]: never; }>;


export type GenerateMagicLinkMutation = { __typename?: 'Mutation', generateMagicLink: { __typename?: 'MagicLinkResponse', message: string } };

export type CreateNoteMutationVariables = Exact<{
  data: CreateNoteInput;
}>;


export type CreateNoteMutation = { __typename?: 'Mutation', createNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };

export type UpdateNoteMutationVariables = Exact<{
  data: UpdateNoteInput;
}>;


export type UpdateNoteMutation = { __typename?: 'Mutation', updateNote: { __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any, client?: { __typename?: 'UserType', id: string, username: string, firstName?: string | null, lastName?: string | null, email: string } | null, createdBy: { __typename?: 'UserType', id: string, username: string, email: string } } | { __typename?: 'OperationInfo' } };

export type DeleteNoteMutationVariables = Exact<{
  data: DeleteDjangoObjectInput;
}>;


export type DeleteNoteMutation = { __typename?: 'Mutation', deleteNote: { __typename?: 'NoteType', id: string } | { __typename?: 'OperationInfo' } };

export type CreateNoteServiceRequestMutationVariables = Exact<{
  data: CreateNoteServiceRequestInput;
}>;


export type CreateNoteServiceRequestMutation = { __typename?: 'Mutation', createNoteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string, service: ServiceEnum } };

export type DeleteServiceRequestMutationVariables = Exact<{
  data: DeleteDjangoObjectInput;
}>;


export type DeleteServiceRequestMutation = { __typename?: 'Mutation', deleteServiceRequest: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'ServiceRequestType', id: string } };

export type CreateNoteMoodMutationVariables = Exact<{
  data: CreateNoteMoodInput;
}>;


export type CreateNoteMoodMutation = { __typename?: 'Mutation', createNoteMood: { __typename?: 'MoodType', id: string, descriptor: MoodEnum } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteMoodMutationVariables = Exact<{
  data: DeleteDjangoObjectInput;
}>;


export type DeleteMoodMutation = { __typename?: 'Mutation', deleteMood: { __typename?: 'DeletedObjectType', id: number } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type CreateNoteTaskMutationVariables = Exact<{
  data: CreateNoteTaskInput;
}>;


export type CreateNoteTaskMutation = { __typename?: 'Mutation', createNoteTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, title: string, status: TaskStatusEnum, dueBy?: any | null, createdAt: any, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type UpdateTaskMutationVariables = Exact<{
  data: UpdateTaskInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string, title: string, status: TaskStatusEnum, dueBy?: any | null, createdAt: any, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', deleteTask: { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } | { __typename?: 'TaskType', id: string } };

export type CreateNoteAttachmentMutationVariables = Exact<{
  noteId: Scalars['ID']['input'];
  namespace: NoteNamespaceEnum;
  file: Scalars['Upload']['input'];
}>;


export type CreateNoteAttachmentMutation = { __typename?: 'Mutation', createNoteAttachment: { __typename?: 'NoteAttachmentType', id: string, attachmentType: AttachmentType, originalFilename?: string | null, namespace: NoteNamespaceEnum, file: { __typename?: 'DjangoFileType', name: string } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type DeleteNoteAttachmentMutationVariables = Exact<{
  attachmentId: Scalars['ID']['input'];
}>;


export type DeleteNoteAttachmentMutation = { __typename?: 'Mutation', deleteNoteAttachment: { __typename?: 'NoteAttachmentType', id: string } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type UpdateNoteLocationMutationVariables = Exact<{
  data: UpdateNoteLocationInput;
}>;


export type UpdateNoteLocationMutation = { __typename?: 'Mutation', updateNoteLocation: { __typename?: 'NoteType', id: string, point?: any | null, address?: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: OperationMessageKind, field?: string | null, message: string }> } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser: { __typename?: 'UserType', id: string, username: string, email: string } };

export type NotesQueryVariables = Exact<{
  filters?: InputMaybe<NoteFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
}>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, title: string, point?: any | null, publicDetails: string, privateDetails?: string | null, isSubmitted: boolean, interactedAt: any, address?: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string, email: string, username: string } | null, createdBy: { __typename?: 'UserType', id: string, email: string, username: string } }> };

export type ViewNoteQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, title: string, point?: any | null, publicDetails: string, privateDetails?: string | null, isSubmitted: boolean, interactedAt: any, createdAt: any, address?: { __typename?: 'AddressType', id: string, street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null, attachments: Array<{ __typename?: 'NoteAttachmentType', id: string, namespace: NoteNamespaceEnum, attachmentType: AttachmentType, file: { __typename?: 'DjangoFileType', path: string, url: string, name: string, size: number } }>, moods: Array<{ __typename?: 'MoodType', id: string, descriptor: MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string, status: TaskStatusEnum, createdAt: any, createdBy: { __typename?: 'UserType', id: string, email: string, username: string } }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };


export const GenerateMagicLinkDocument = gql`
    mutation GenerateMagicLink {
  generateMagicLink(data: {email: "paul+test@betterangels.la"}) {
    message
  }
}
    `;
export type GenerateMagicLinkMutationFn = Apollo.MutationFunction<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>;

/**
 * __useGenerateMagicLinkMutation__
 *
 * To run a mutation, you first call `useGenerateMagicLinkMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateMagicLinkMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateMagicLinkMutation, { data, loading, error }] = useGenerateMagicLinkMutation({
 *   variables: {
 *   },
 * });
 */
export function useGenerateMagicLinkMutation(baseOptions?: Apollo.MutationHookOptions<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>(GenerateMagicLinkDocument, options);
      }
export type GenerateMagicLinkMutationHookResult = ReturnType<typeof useGenerateMagicLinkMutation>;
export type GenerateMagicLinkMutationResult = Apollo.MutationResult<GenerateMagicLinkMutation>;
export type GenerateMagicLinkMutationOptions = Apollo.BaseMutationOptions<GenerateMagicLinkMutation, GenerateMagicLinkMutationVariables>;
export const CreateNoteDocument = gql`
    mutation CreateNote($data: CreateNoteInput!) {
  createNote(data: $data) {
    ... on NoteType {
      id
      title
      publicDetails
      client {
        id
        username
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
export type CreateNoteMutationFn = Apollo.MutationFunction<CreateNoteMutation, CreateNoteMutationVariables>;

/**
 * __useCreateNoteMutation__
 *
 * To run a mutation, you first call `useCreateNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteMutation, { data, loading, error }] = useCreateNoteMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteMutation, CreateNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteMutation, CreateNoteMutationVariables>(CreateNoteDocument, options);
      }
export type CreateNoteMutationHookResult = ReturnType<typeof useCreateNoteMutation>;
export type CreateNoteMutationResult = Apollo.MutationResult<CreateNoteMutation>;
export type CreateNoteMutationOptions = Apollo.BaseMutationOptions<CreateNoteMutation, CreateNoteMutationVariables>;
export const UpdateNoteDocument = gql`
    mutation UpdateNote($data: UpdateNoteInput!) {
  updateNote(data: $data) {
    ... on NoteType {
      id
      title
      publicDetails
      client {
        id
        username
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
      service
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
    ... on ServiceRequestType {
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
export const CreateNoteMoodDocument = gql`
    mutation CreateNoteMood($data: CreateNoteMoodInput!) {
  createNoteMood(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on MoodType {
      id
      descriptor
    }
  }
}
    `;
export type CreateNoteMoodMutationFn = Apollo.MutationFunction<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>;

/**
 * __useCreateNoteMoodMutation__
 *
 * To run a mutation, you first call `useCreateNoteMoodMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteMoodMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteMoodMutation, { data, loading, error }] = useCreateNoteMoodMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteMoodMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>(CreateNoteMoodDocument, options);
      }
export type CreateNoteMoodMutationHookResult = ReturnType<typeof useCreateNoteMoodMutation>;
export type CreateNoteMoodMutationResult = Apollo.MutationResult<CreateNoteMoodMutation>;
export type CreateNoteMoodMutationOptions = Apollo.BaseMutationOptions<CreateNoteMoodMutation, CreateNoteMoodMutationVariables>;
export const DeleteMoodDocument = gql`
    mutation DeleteMood($data: DeleteDjangoObjectInput!) {
  deleteMood(data: $data) {
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
export type DeleteMoodMutationFn = Apollo.MutationFunction<DeleteMoodMutation, DeleteMoodMutationVariables>;

/**
 * __useDeleteMoodMutation__
 *
 * To run a mutation, you first call `useDeleteMoodMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMoodMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMoodMutation, { data, loading, error }] = useDeleteMoodMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useDeleteMoodMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMoodMutation, DeleteMoodMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMoodMutation, DeleteMoodMutationVariables>(DeleteMoodDocument, options);
      }
export type DeleteMoodMutationHookResult = ReturnType<typeof useDeleteMoodMutation>;
export type DeleteMoodMutationResult = Apollo.MutationResult<DeleteMoodMutation>;
export type DeleteMoodMutationOptions = Apollo.BaseMutationOptions<DeleteMoodMutation, DeleteMoodMutationVariables>;
export const CreateNoteTaskDocument = gql`
    mutation CreateNoteTask($data: CreateNoteTaskInput!) {
  createNoteTask(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
      title
      status
      dueBy
      client {
        id
      }
      createdBy {
        id
      }
      createdAt
    }
  }
}
    `;
export type CreateNoteTaskMutationFn = Apollo.MutationFunction<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>;

/**
 * __useCreateNoteTaskMutation__
 *
 * To run a mutation, you first call `useCreateNoteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteTaskMutation, { data, loading, error }] = useCreateNoteTaskMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNoteTaskMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>(CreateNoteTaskDocument, options);
      }
export type CreateNoteTaskMutationHookResult = ReturnType<typeof useCreateNoteTaskMutation>;
export type CreateNoteTaskMutationResult = Apollo.MutationResult<CreateNoteTaskMutation>;
export type CreateNoteTaskMutationOptions = Apollo.BaseMutationOptions<CreateNoteTaskMutation, CreateNoteTaskMutationVariables>;
export const UpdateTaskDocument = gql`
    mutation UpdateTask($data: UpdateTaskInput!) {
  updateTask(data: $data) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
      title
      status
      dueBy
      client {
        id
      }
      createdBy {
        id
      }
      createdAt
    }
  }
}
    `;
export type UpdateTaskMutationFn = Apollo.MutationFunction<UpdateTaskMutation, UpdateTaskMutationVariables>;

/**
 * __useUpdateTaskMutation__
 *
 * To run a mutation, you first call `useUpdateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskMutation, { data, loading, error }] = useUpdateTaskMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateTaskMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTaskMutation, UpdateTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, options);
      }
export type UpdateTaskMutationHookResult = ReturnType<typeof useUpdateTaskMutation>;
export type UpdateTaskMutationResult = Apollo.MutationResult<UpdateTaskMutation>;
export type UpdateTaskMutationOptions = Apollo.BaseMutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const DeleteTaskDocument = gql`
    mutation DeleteTask($id: ID!) {
  deleteTask(data: {id: $id}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on TaskType {
      id
    }
  }
}
    `;
export type DeleteTaskMutationFn = Apollo.MutationFunction<DeleteTaskMutation, DeleteTaskMutationVariables>;

/**
 * __useDeleteTaskMutation__
 *
 * To run a mutation, you first call `useDeleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTaskMutation, { data, loading, error }] = useDeleteTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTaskMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTaskMutation, DeleteTaskMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
      }
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const CreateNoteAttachmentDocument = gql`
    mutation CreateNoteAttachment($noteId: ID!, $namespace: NoteNamespaceEnum!, $file: Upload!) {
  createNoteAttachment(data: {note: $noteId, namespace: $namespace, file: $file}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteAttachmentType {
      id
      attachmentType
      file {
        name
      }
      originalFilename
      namespace
    }
  }
}
    `;
export type CreateNoteAttachmentMutationFn = Apollo.MutationFunction<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>;

/**
 * __useCreateNoteAttachmentMutation__
 *
 * To run a mutation, you first call `useCreateNoteAttachmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNoteAttachmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNoteAttachmentMutation, { data, loading, error }] = useCreateNoteAttachmentMutation({
 *   variables: {
 *      noteId: // value for 'noteId'
 *      namespace: // value for 'namespace'
 *      file: // value for 'file'
 *   },
 * });
 */
export function useCreateNoteAttachmentMutation(baseOptions?: Apollo.MutationHookOptions<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>(CreateNoteAttachmentDocument, options);
      }
export type CreateNoteAttachmentMutationHookResult = ReturnType<typeof useCreateNoteAttachmentMutation>;
export type CreateNoteAttachmentMutationResult = Apollo.MutationResult<CreateNoteAttachmentMutation>;
export type CreateNoteAttachmentMutationOptions = Apollo.BaseMutationOptions<CreateNoteAttachmentMutation, CreateNoteAttachmentMutationVariables>;
export const DeleteNoteAttachmentDocument = gql`
    mutation DeleteNoteAttachment($attachmentId: ID!) {
  deleteNoteAttachment(data: {id: $attachmentId}) {
    ... on OperationInfo {
      messages {
        kind
        field
        message
      }
    }
    ... on NoteAttachmentType {
      id
    }
  }
}
    `;
export type DeleteNoteAttachmentMutationFn = Apollo.MutationFunction<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>;

/**
 * __useDeleteNoteAttachmentMutation__
 *
 * To run a mutation, you first call `useDeleteNoteAttachmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNoteAttachmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNoteAttachmentMutation, { data, loading, error }] = useDeleteNoteAttachmentMutation({
 *   variables: {
 *      attachmentId: // value for 'attachmentId'
 *   },
 * });
 */
export function useDeleteNoteAttachmentMutation(baseOptions?: Apollo.MutationHookOptions<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>(DeleteNoteAttachmentDocument, options);
      }
export type DeleteNoteAttachmentMutationHookResult = ReturnType<typeof useDeleteNoteAttachmentMutation>;
export type DeleteNoteAttachmentMutationResult = Apollo.MutationResult<DeleteNoteAttachmentMutation>;
export type DeleteNoteAttachmentMutationOptions = Apollo.BaseMutationOptions<DeleteNoteAttachmentMutation, DeleteNoteAttachmentMutationVariables>;
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
      point
      address {
        street
        city
        state
        zipCode
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
export const CurrentUserDocument = gql`
    query currentUser {
  currentUser {
    id
    username
    email
  }
}
    `;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<typeof useCurrentUserSuspenseQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const NotesDocument = gql`
    query Notes($filters: NoteFilter, $pagination: OffsetPaginationInput) {
  notes(filters: $filters, pagination: $pagination) {
    id
    title
    point
    address {
      id
      street
      city
      state
      zipCode
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
    privateDetails
    isSubmitted
    client {
      id
      email
      username
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
    point
    address {
      id
      street
      city
      state
      zipCode
    }
    attachments {
      id
      file {
        path
        url
        name
        size
      }
      namespace
      attachmentType
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
    privateDetails
    isSubmitted
    client {
      id
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