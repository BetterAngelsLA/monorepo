import * as Types from '../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisProgramNoteViewQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
  personalId: Types.Scalars['ID']['input'];
  enrollmentId: Types.Scalars['ID']['input'];
}>;


export type HmisProgramNoteViewQuery = { __typename?: 'Query', hmisGetClientNote: { __typename?: 'HmisClientNoteType', id?: string | null, category?: string | null, date?: string | null, note?: string | null, title?: string | null } | { __typename?: 'HmisGetClientNoteError', field?: string | null, message: string } };


export const HmisProgramNoteViewDocument = gql`
    query HmisProgramNoteView($id: ID!, $personalId: ID!, $enrollmentId: ID!) {
  hmisGetClientNote(id: $id, personalId: $personalId, enrollmentId: $enrollmentId) {
    ... on HmisClientNoteType {
      id
      category
      date
      note
      title
    }
    ... on HmisGetClientNoteError {
      field
      message
    }
  }
}
    `;

/**
 * __useHmisProgramNoteViewQuery__
 *
 * To run a query within a React component, call `useHmisProgramNoteViewQuery` and pass it any options that fit your needs.
 * When your component renders, `useHmisProgramNoteViewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHmisProgramNoteViewQuery({
 *   variables: {
 *      id: // value for 'id'
 *      personalId: // value for 'personalId'
 *      enrollmentId: // value for 'enrollmentId'
 *   },
 * });
 */
export function useHmisProgramNoteViewQuery(baseOptions: Apollo.QueryHookOptions<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables> & ({ variables: HmisProgramNoteViewQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables>(HmisProgramNoteViewDocument, options);
      }
export function useHmisProgramNoteViewLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables>(HmisProgramNoteViewDocument, options);
        }
export function useHmisProgramNoteViewSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables>(HmisProgramNoteViewDocument, options);
        }
export type HmisProgramNoteViewQueryHookResult = ReturnType<typeof useHmisProgramNoteViewQuery>;
export type HmisProgramNoteViewLazyQueryHookResult = ReturnType<typeof useHmisProgramNoteViewLazyQuery>;
export type HmisProgramNoteViewSuspenseQueryHookResult = ReturnType<typeof useHmisProgramNoteViewSuspenseQuery>;
export type HmisProgramNoteViewQueryResult = Apollo.QueryResult<HmisProgramNoteViewQuery, HmisProgramNoteViewQueryVariables>;