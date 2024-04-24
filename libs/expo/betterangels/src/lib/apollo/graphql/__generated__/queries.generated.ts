import * as Types from './types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type NotesQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type NotesQuery = { __typename?: 'Query', notes: Array<{ __typename?: 'NoteType', id: string, title: string, publicDetails: string, createdAt: any }> };

export type ViewNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewNoteQuery = { __typename?: 'Query', note: { __typename?: 'NoteType', id: string, title: string, point?: any | null, publicDetails: string, privateDetails?: string | null, isSubmitted: boolean, interactedAt: any, address?: { __typename?: 'AddressType', street?: string | null, city?: string | null, state?: string | null, zipCode?: string | null } | null, moods: Array<{ __typename?: 'MoodType', descriptor: Types.MoodEnum }>, purposes: Array<{ __typename?: 'TaskType', id: string, title: string }>, nextSteps: Array<{ __typename?: 'TaskType', id: string, title: string }>, providedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, requestedServices: Array<{ __typename?: 'ServiceRequestType', id: string, service: Types.ServiceEnum, customService?: string | null }>, client?: { __typename?: 'UserType', id: string } | null, createdBy: { __typename?: 'UserType', id: string } } };

export type GoogleAuthMutationVariables = Types.Exact<{
  code: Types.Scalars['String']['input'];
  codeVerifier: Types.Scalars['String']['input'];
  redirectUri: Types.Scalars['String']['input'];
}>;


export type GoogleAuthMutation = { __typename?: 'Mutation', googleAuth: { __typename?: 'AuthResponse', code: string, code_verifier: string } };

export type IdmeAuthMutationVariables = Types.Exact<{
  code: Types.Scalars['String']['input'];
  codeVerifier: Types.Scalars['String']['input'];
  redirectUri: Types.Scalars['String']['input'];
}>;


export type IdmeAuthMutation = { __typename?: 'Mutation', idmeAuth: { __typename?: 'AuthResponse', code: string, code_verifier: string } };


export const NotesDocument = gql`
    query notes {
  notes {
    id
    title
    publicDetails
    createdAt
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
      street
      city
      state
      zipCode
    }
    moods {
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
    }
    createdBy {
      id
    }
    interactedAt
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
export const GoogleAuthDocument = gql`
    mutation GoogleAuth($code: String!, $codeVerifier: String!, $redirectUri: String!) {
  googleAuth(
    input: {code: $code, code_verifier: $codeVerifier, redirect_uri: $redirectUri}
  ) @rest(type: "AuthResponse", path: "/rest-auth/google/?redirect_uri={args.input.redirectUri}", method: "POST", bodyKey: "input") {
    code
    code_verifier
  }
}
    `;
export type GoogleAuthMutationFn = Apollo.MutationFunction<GoogleAuthMutation, GoogleAuthMutationVariables>;

/**
 * __useGoogleAuthMutation__
 *
 * To run a mutation, you first call `useGoogleAuthMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGoogleAuthMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [googleAuthMutation, { data, loading, error }] = useGoogleAuthMutation({
 *   variables: {
 *      code: // value for 'code'
 *      codeVerifier: // value for 'codeVerifier'
 *      redirectUri: // value for 'redirectUri'
 *   },
 * });
 */
export function useGoogleAuthMutation(baseOptions?: Apollo.MutationHookOptions<GoogleAuthMutation, GoogleAuthMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GoogleAuthMutation, GoogleAuthMutationVariables>(GoogleAuthDocument, options);
      }
export type GoogleAuthMutationHookResult = ReturnType<typeof useGoogleAuthMutation>;
export type GoogleAuthMutationResult = Apollo.MutationResult<GoogleAuthMutation>;
export type GoogleAuthMutationOptions = Apollo.BaseMutationOptions<GoogleAuthMutation, GoogleAuthMutationVariables>;
export const IdmeAuthDocument = gql`
    mutation IdmeAuth($code: String!, $codeVerifier: String!, $redirectUri: String!) {
  idmeAuth(
    input: {code: $code, code_verifier: $codeVerifier, redirect_uri: $redirectUri}
  ) @rest(type: "AuthResponse", path: "/rest-auth/idme/?redirect_uri={args.input.redirectUri}", method: "POST", bodyKey: "input") {
    code
    code_verifier
  }
}
    `;
export type IdmeAuthMutationFn = Apollo.MutationFunction<IdmeAuthMutation, IdmeAuthMutationVariables>;

/**
 * __useIdmeAuthMutation__
 *
 * To run a mutation, you first call `useIdmeAuthMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIdmeAuthMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [idmeAuthMutation, { data, loading, error }] = useIdmeAuthMutation({
 *   variables: {
 *      code: // value for 'code'
 *      codeVerifier: // value for 'codeVerifier'
 *      redirectUri: // value for 'redirectUri'
 *   },
 * });
 */
export function useIdmeAuthMutation(baseOptions?: Apollo.MutationHookOptions<IdmeAuthMutation, IdmeAuthMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IdmeAuthMutation, IdmeAuthMutationVariables>(IdmeAuthDocument, options);
      }
export type IdmeAuthMutationHookResult = ReturnType<typeof useIdmeAuthMutation>;
export type IdmeAuthMutationResult = Apollo.MutationResult<IdmeAuthMutation>;
export type IdmeAuthMutationOptions = Apollo.BaseMutationOptions<IdmeAuthMutation, IdmeAuthMutationVariables>;