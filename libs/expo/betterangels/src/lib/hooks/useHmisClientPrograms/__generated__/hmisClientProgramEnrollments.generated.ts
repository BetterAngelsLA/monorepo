import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisClientProgramEnrollmentsQueryVariables = Types.Exact<{
  personalId: Types.Scalars['ID']['input'];
  dynamicFields: Array<Types.InputMaybe<Types.Scalars['String']['input']>> | Types.InputMaybe<Types.Scalars['String']['input']>;
  pagination?: Types.InputMaybe<Types.HmisPaginationInput>;
}>;


export type HmisClientProgramEnrollmentsQuery = { __typename?: 'Query', hmisListEnrollments: { __typename?: 'HmisEnrollmentListType', items: Array<{ __typename?: 'HmisEnrollmentType', personalId?: string | null, enrollmentId?: string | null, entryDate?: string | null, exitDate?: string | null, project?: { __typename?: 'HmisProjectType', projectId?: string | null, projectName?: string | null, projectType?: string | null } | null }>, meta?: { __typename?: 'HmisListMetaType', currentPage?: number | null, pageCount?: number | null, perPage?: number | null, totalCount?: number | null } | null } | { __typename?: 'HmisListEnrollmentsError', message: string } };


export const HmisClientProgramEnrollmentsDocument = gql`
    query HmisClientProgramEnrollments($personalId: ID!, $dynamicFields: [String]!, $pagination: HmisPaginationInput) {
  hmisListEnrollments(
    personalId: $personalId
    dynamicFields: $dynamicFields
    pagination: $pagination
  ) {
    ... on HmisEnrollmentListType {
      items {
        personalId
        enrollmentId
        entryDate
        exitDate
        project {
          projectId
          projectName
          projectType
        }
      }
      meta {
        currentPage
        pageCount
        perPage
        totalCount
      }
    }
    ... on HmisListEnrollmentsError {
      message
    }
  }
}
    `;

/**
 * __useHmisClientProgramEnrollmentsQuery__
 *
 * To run a query within a React component, call `useHmisClientProgramEnrollmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHmisClientProgramEnrollmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHmisClientProgramEnrollmentsQuery({
 *   variables: {
 *      personalId: // value for 'personalId'
 *      dynamicFields: // value for 'dynamicFields'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useHmisClientProgramEnrollmentsQuery(baseOptions: Apollo.QueryHookOptions<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables> & ({ variables: HmisClientProgramEnrollmentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables>(HmisClientProgramEnrollmentsDocument, options);
      }
export function useHmisClientProgramEnrollmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables>(HmisClientProgramEnrollmentsDocument, options);
        }
export function useHmisClientProgramEnrollmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables>(HmisClientProgramEnrollmentsDocument, options);
        }
export type HmisClientProgramEnrollmentsQueryHookResult = ReturnType<typeof useHmisClientProgramEnrollmentsQuery>;
export type HmisClientProgramEnrollmentsLazyQueryHookResult = ReturnType<typeof useHmisClientProgramEnrollmentsLazyQuery>;
export type HmisClientProgramEnrollmentsSuspenseQueryHookResult = ReturnType<typeof useHmisClientProgramEnrollmentsSuspenseQuery>;
export type HmisClientProgramEnrollmentsQueryResult = Apollo.QueryResult<HmisClientProgramEnrollmentsQuery, HmisClientProgramEnrollmentsQueryVariables>;