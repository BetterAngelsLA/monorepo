import * as Types from '../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisListClientNotesQueryVariables = Types.Exact<{
  enrollmentId: Types.Scalars['ID']['input'];
  pagination?: Types.InputMaybe<Types.HmisPaginationInput>;
  personalId: Types.Scalars['ID']['input'];
}>;


export type HmisListClientNotesQuery = { __typename?: 'Query', hmisListClientNotes: { __typename: 'HmisClientNoteListType', items: Array<{ __typename?: 'HmisClientNoteType', category?: string | null, date?: string | null, id?: string | null, note?: string | null, title?: string | null }>, meta?: { __typename?: 'HmisListMetaType', currentPage?: number | null, pageCount?: number | null, perPage?: number | null, totalCount?: number | null } | null } | { __typename?: 'HmisListClientNotesError' } };


export const HmisListClientNotesDocument = gql`
    query HmisListClientNotes($enrollmentId: ID!, $pagination: HmisPaginationInput = null, $personalId: ID!) {
  hmisListClientNotes(
    enrollmentId: $enrollmentId
    personalId: $personalId
    pagination: $pagination
  ) {
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
 * __useHmisListClientNotesQuery__
 *
 * To run a query within a React component, call `useHmisListClientNotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useHmisListClientNotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHmisListClientNotesQuery({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *      pagination: // value for 'pagination'
 *      personalId: // value for 'personalId'
 *   },
 * });
 */
export function useHmisListClientNotesQuery(baseOptions: Apollo.QueryHookOptions<HmisListClientNotesQuery, HmisListClientNotesQueryVariables> & ({ variables: HmisListClientNotesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HmisListClientNotesQuery, HmisListClientNotesQueryVariables>(HmisListClientNotesDocument, options);
      }
export function useHmisListClientNotesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HmisListClientNotesQuery, HmisListClientNotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HmisListClientNotesQuery, HmisListClientNotesQueryVariables>(HmisListClientNotesDocument, options);
        }
export function useHmisListClientNotesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HmisListClientNotesQuery, HmisListClientNotesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HmisListClientNotesQuery, HmisListClientNotesQueryVariables>(HmisListClientNotesDocument, options);
        }
export type HmisListClientNotesQueryHookResult = ReturnType<typeof useHmisListClientNotesQuery>;
export type HmisListClientNotesLazyQueryHookResult = ReturnType<typeof useHmisListClientNotesLazyQuery>;
export type HmisListClientNotesSuspenseQueryHookResult = ReturnType<typeof useHmisListClientNotesSuspenseQuery>;
export type HmisListClientNotesQueryResult = Apollo.QueryResult<HmisListClientNotesQuery, HmisListClientNotesQueryVariables>;