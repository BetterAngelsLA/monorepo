import * as Types from '../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateNoteAttachmentMutationVariables = Types.Exact<{
  noteId: Types.Scalars['ID']['input'];
  namespace: Types.NoteNamespaceEnum;
  file: Types.Scalars['Upload']['input'];
}>;


export type CreateNoteAttachmentMutation = { __typename?: 'Mutation', createNoteAttachment: { __typename?: 'NoteAttachmentType', id: string, attachmentType: Types.AttachmentType, originalFilename?: string | null, namespace: Types.NoteNamespaceEnum, file: { __typename?: 'DjangoFileType', name: string } } | { __typename?: 'OperationInfo', messages: Array<{ __typename?: 'OperationMessage', kind: Types.OperationMessageKind, field?: string | null, message: string }> } };


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