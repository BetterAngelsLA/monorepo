import * as Types from '../../../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisListClientNotesQueryVariables = Types.Exact<{
  enrollmentId: Types.Scalars['ID']['input'];
  pagination?: Types.InputMaybe<Types.HmisPaginationInput>;
  personalId: Types.Scalars['ID']['input'];
}>;


export type HmisListClientNotesQuery = { __typename?: 'Query', hmisListClientNotes: { __typename: 'HmisClientNoteListType', items: Array<{ __typename?: 'HmisClientNoteType', category?: string | null, date?: string | null, id?: string | null, note?: string | null, title?: string | null, enrollment?: { __typename?: 'HmisEnrollmentType', enrollmentId?: string | null } | null }>, meta?: { __typename?: 'HmisListMetaType', currentPage?: number | null, pageCount?: number | null, perPage?: number | null, totalCount?: number | null } | null } | { __typename?: 'HmisListClientNotesError', field?: string | null, message: string } };

export type HmisNotesQueryVariables = Types.Exact<{
  filters?: Types.InputMaybe<Types.HmisNoteFilter>;
  pagination?: Types.InputMaybe<Types.OffsetPaginationInput>;
  ordering?: Array<Types.HmisNoteOrdering> | Types.HmisNoteOrdering;
}>;


export type HmisNotesQuery = { __typename?: 'Query', hmisNotes: { __typename?: 'HmisNoteTypeOffsetPaginated', totalCount: number, pageInfo: { __typename?: 'OffsetPaginationInfo', limit?: number | null, offset: number }, results: Array<{ __typename?: 'HmisNoteType', id: string, hmisId: string, hmisClientProfileId: string, addedDate?: any | null, lastUpdated?: any | null, title?: string | null, note: string, date?: any | null, refClientProgram?: number | null, createdBy?: { __typename?: 'UserType', id: string, firstName?: string | null, lastName?: string | null } | null }> } };


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
        enrollment {
          enrollmentId
        }
      }
      meta {
        currentPage
        pageCount
        perPage
        totalCount
      }
    }
    ... on HmisListClientNotesError {
      field
      message
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
export const HmisNotesDocument = gql`
    query HmisNotes($filters: HmisNoteFilter, $pagination: OffsetPaginationInput, $ordering: [HmisNoteOrdering!]! = []) {
  hmisNotes(filters: $filters, pagination: $pagination, ordering: $ordering) {
    totalCount
    pageInfo {
      limit
      offset
    }
    results {
      id
      hmisId
      hmisClientProfileId
      addedDate
      lastUpdated
      title
      note
      date
      refClientProgram
      createdBy {
        id
        firstName
        lastName
      }
    }
  }
}
    `;

/**
 * __useHmisNotesQuery__
 *
 * To run a query within a React component, call `useHmisNotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useHmisNotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHmisNotesQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      pagination: // value for 'pagination'
 *      ordering: // value for 'ordering'
 *   },
 * });
 */
export function useHmisNotesQuery(baseOptions?: Apollo.QueryHookOptions<HmisNotesQuery, HmisNotesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HmisNotesQuery, HmisNotesQueryVariables>(HmisNotesDocument, options);
      }
export function useHmisNotesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HmisNotesQuery, HmisNotesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HmisNotesQuery, HmisNotesQueryVariables>(HmisNotesDocument, options);
        }
export function useHmisNotesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HmisNotesQuery, HmisNotesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HmisNotesQuery, HmisNotesQueryVariables>(HmisNotesDocument, options);
        }
export type HmisNotesQueryHookResult = ReturnType<typeof useHmisNotesQuery>;
export type HmisNotesLazyQueryHookResult = ReturnType<typeof useHmisNotesLazyQuery>;
export type HmisNotesSuspenseQueryHookResult = ReturnType<typeof useHmisNotesSuspenseQuery>;
export type HmisNotesQueryResult = Apollo.QueryResult<HmisNotesQuery, HmisNotesQueryVariables>;