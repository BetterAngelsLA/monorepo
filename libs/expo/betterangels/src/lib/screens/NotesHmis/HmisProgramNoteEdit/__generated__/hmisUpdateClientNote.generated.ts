import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisUpdateClientNoteMutationVariables = Types.Exact<{
  clientNoteInput: Types.HmisUpdateClientNoteInput;
}>;


export type HmisUpdateClientNoteMutation = { __typename?: 'Mutation', hmisUpdateClientNote: { __typename?: 'HmisClientNoteType', id?: string | null, title?: string | null, note?: string | null, date?: string | null, category?: string | null, client?: { __typename?: 'HmisClientType', personalId?: string | null } | null, enrollment?: { __typename?: 'HmisEnrollmentType', enrollmentId?: string | null } | null } | { __typename?: 'HmisUpdateClientNoteError', message: string, field?: string | null } };


export const HmisUpdateClientNoteDocument = gql`
    mutation HmisUpdateClientNote($clientNoteInput: HmisUpdateClientNoteInput!) {
  hmisUpdateClientNote(clientNoteInput: $clientNoteInput) {
    ... on HmisClientNoteType {
      id
      title
      note
      date
      category
      client {
        personalId
      }
      enrollment {
        enrollmentId
      }
    }
    ... on HmisUpdateClientNoteError {
      message
      field
    }
  }
}
    `;
export type HmisUpdateClientNoteMutationFn = Apollo.MutationFunction<HmisUpdateClientNoteMutation, HmisUpdateClientNoteMutationVariables>;

/**
 * __useHmisUpdateClientNoteMutation__
 *
 * To run a mutation, you first call `useHmisUpdateClientNoteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useHmisUpdateClientNoteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [hmisUpdateClientNoteMutation, { data, loading, error }] = useHmisUpdateClientNoteMutation({
 *   variables: {
 *      clientNoteInput: // value for 'clientNoteInput'
 *   },
 * });
 */
export function useHmisUpdateClientNoteMutation(baseOptions?: Apollo.MutationHookOptions<HmisUpdateClientNoteMutation, HmisUpdateClientNoteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<HmisUpdateClientNoteMutation, HmisUpdateClientNoteMutationVariables>(HmisUpdateClientNoteDocument, options);
      }
export type HmisUpdateClientNoteMutationHookResult = ReturnType<typeof useHmisUpdateClientNoteMutation>;
export type HmisUpdateClientNoteMutationResult = Apollo.MutationResult<HmisUpdateClientNoteMutation>;
export type HmisUpdateClientNoteMutationOptions = Apollo.BaseMutationOptions<HmisUpdateClientNoteMutation, HmisUpdateClientNoteMutationVariables>;