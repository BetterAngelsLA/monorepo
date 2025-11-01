import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisGetClientNoteQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
  personalId: Types.Scalars['ID']['input'];
  enrollmentId: Types.Scalars['ID']['input'];
}>;


export type HmisGetClientNoteQuery = { __typename?: 'Query', hmisGetClientNote: { __typename?: 'HmisClientNoteType', id?: string | null, title?: string | null, note?: string | null, date?: string | null, category?: string | null, client?: { __typename?: 'HmisClientType', personalId?: string | null } | null, enrollment?: { __typename?: 'HmisEnrollmentType', enrollmentId?: string | null, project?: { __typename?: 'HmisProjectType', projectId?: string | null, projectName?: string | null } | null } | null } | { __typename?: 'HmisGetClientNoteError', field?: string | null, message: string } };


export const HmisGetClientNoteDocument = gql`
    query HmisGetClientNote($id: ID!, $personalId: ID!, $enrollmentId: ID!) {
  hmisGetClientNote(id: $id, personalId: $personalId, enrollmentId: $enrollmentId) {
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
        project {
          projectId
          projectName
        }
      }
    }
    ... on HmisGetClientNoteError {
      field
      message
    }
  }
}
    `;

/**
 * __useHmisGetClientNoteQuery__
 *
 * To run a query within a React component, call `useHmisGetClientNoteQuery` and pass it any options that fit your needs.
 * When your component renders, `useHmisGetClientNoteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHmisGetClientNoteQuery({
 *   variables: {
 *      id: // value for 'id'
 *      personalId: // value for 'personalId'
 *      enrollmentId: // value for 'enrollmentId'
 *   },
 * });
 */
export function useHmisGetClientNoteQuery(baseOptions: Apollo.QueryHookOptions<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables> & ({ variables: HmisGetClientNoteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables>(HmisGetClientNoteDocument, options);
      }
export function useHmisGetClientNoteLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables>(HmisGetClientNoteDocument, options);
        }
export function useHmisGetClientNoteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables>(HmisGetClientNoteDocument, options);
        }
export type HmisGetClientNoteQueryHookResult = ReturnType<typeof useHmisGetClientNoteQuery>;
export type HmisGetClientNoteLazyQueryHookResult = ReturnType<typeof useHmisGetClientNoteLazyQuery>;
export type HmisGetClientNoteSuspenseQueryHookResult = ReturnType<typeof useHmisGetClientNoteSuspenseQuery>;
export type HmisGetClientNoteQueryResult = Apollo.QueryResult<HmisGetClientNoteQuery, HmisGetClientNoteQueryVariables>;