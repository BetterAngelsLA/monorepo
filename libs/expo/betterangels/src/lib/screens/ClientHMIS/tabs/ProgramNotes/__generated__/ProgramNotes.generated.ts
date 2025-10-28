import * as Types from '../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ListClientProgramNotesQueryVariables = Types.Exact<{
  enrollmentId: Types.Scalars['ID']['input'];
  pagination?: Types.InputMaybe<Types.HmisPaginationInput>;
  personalId: Types.Scalars['ID']['input'];
}>;


export type ListClientProgramNotesQuery = { __typename?: 'Query', hmisListClientNotes: { __typename: 'HmisClientNoteListType', items: Array<{ __typename?: 'HmisClientNoteType', category?: string | null, date?: string | null, id?: string | null, note?: string | null, title?: string | null }>, meta?: { __typename?: 'HmisListMetaType', currentPage?: number | null, pageCount?: number | null, perPage?: number | null, totalCount?: number | null } | null } | { __typename: 'HmisListClientNotesError' } };


export const ListClientProgramNotesDocument = gql`
    query ListClientProgramNotes($enrollmentId: ID!, $pagination: HmisPaginationInput = null, $personalId: ID!) {
  hmisListClientNotes(
    enrollmentId: $enrollmentId
    personalId: $personalId
    pagination: $pagination
  ) {
    __typename
    ... on HmisClientNoteListType {
      __typename
      items {
        category
        date
        id
        note
        title
      }
      meta {
        currentPage
        pageCount
        perPage
        totalCount
      }
    }
  }
}
    `;

/**
 * __useListClientProgramNotesQuery__
 *
 * To run a query within a React component, call `useListClientProgramNotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListClientProgramNotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListClientProgramNotesQuery({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *      pagination: // value for 'pagination'
 *      personalId: // value for 'personalId'
 *   },
 * });
 */
export function useListClientProgramNotesQuery(baseOptions: Apollo.QueryHookOptions<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables> & ({ variables: ListClientProgramNotesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables>(ListClientProgramNotesDocument, options);
      }
export function useListClientProgramNotesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables>(ListClientProgramNotesDocument, options);
        }
export function useListClientProgramNotesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables>(ListClientProgramNotesDocument, options);
        }
export type ListClientProgramNotesQueryHookResult = ReturnType<typeof useListClientProgramNotesQuery>;
export type ListClientProgramNotesLazyQueryHookResult = ReturnType<typeof useListClientProgramNotesLazyQuery>;
export type ListClientProgramNotesSuspenseQueryHookResult = ReturnType<typeof useListClientProgramNotesSuspenseQuery>;
export type ListClientProgramNotesQueryResult = Apollo.QueryResult<ListClientProgramNotesQuery, ListClientProgramNotesQueryVariables>;