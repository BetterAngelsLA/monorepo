import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type HmisListClientsQueryVariables = Types.Exact<{
  filter?: Types.InputMaybe<Types.HmisClientFilterInput>;
  pagination?: Types.InputMaybe<Types.HmisPaginationInput>;
}>;


export type HmisListClientsQuery = { __typename?: 'Query', hmisListClients: { __typename?: 'HmisClientListType', items: Array<{ __typename?: 'HmisClientType', personalId?: string | null, uniqueIdentifier?: string | null, firstName?: string | null, lastName?: string | null, nameDataQuality?: Types.HmisNameQualityEnum | null, ssn1?: string | null, ssn2?: string | null, ssn3?: string | null, ssnDataQuality?: Types.HmisSsnQualityEnum | null, dob?: string | null, dobDataQuality?: Types.HmisDobQualityEnum | null, data?: { __typename?: 'HmisClientDataType', middleName?: string | null, nameSuffix?: Types.HmisSuffixEnum | null, alias?: string | null, raceEthnicity: Array<Types.HmisRaceEnum>, additionalRaceEthnicity?: string | null, differentIdentityText?: string | null, gender: Array<Types.HmisGenderEnum>, veteranStatus: Types.HmisVeteranStatusEnum } | null }>, meta?: { __typename?: 'HmisListMetaType', currentPage?: number | null, pageCount?: number | null, perPage?: number | null, totalCount?: number | null } | null } | { __typename?: 'HmisListClientsError' } };


export const HmisListClientsDocument = gql`
    query HmisListClients($filter: HmisClientFilterInput, $pagination: HmisPaginationInput) {
  hmisListClients(filter: $filter, pagination: $pagination) {
    ... on HmisClientListType {
      items {
        personalId
        uniqueIdentifier
        firstName
        lastName
        nameDataQuality
        ssn1
        ssn2
        ssn3
        ssnDataQuality
        dob
        dobDataQuality
        data {
          middleName
          nameSuffix
          alias
          raceEthnicity
          additionalRaceEthnicity
          differentIdentityText
          gender
          veteranStatus
        }
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
 * __useHmisListClientsQuery__
 *
 * To run a query within a React component, call `useHmisListClientsQuery` and pass it any options that fit your needs.
 * When your component renders, `useHmisListClientsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHmisListClientsQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useHmisListClientsQuery(baseOptions?: Apollo.QueryHookOptions<HmisListClientsQuery, HmisListClientsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HmisListClientsQuery, HmisListClientsQueryVariables>(HmisListClientsDocument, options);
      }
export function useHmisListClientsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HmisListClientsQuery, HmisListClientsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HmisListClientsQuery, HmisListClientsQueryVariables>(HmisListClientsDocument, options);
        }
export function useHmisListClientsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HmisListClientsQuery, HmisListClientsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HmisListClientsQuery, HmisListClientsQueryVariables>(HmisListClientsDocument, options);
        }
export type HmisListClientsQueryHookResult = ReturnType<typeof useHmisListClientsQuery>;
export type HmisListClientsLazyQueryHookResult = ReturnType<typeof useHmisListClientsLazyQuery>;
export type HmisListClientsSuspenseQueryHookResult = ReturnType<typeof useHmisListClientsSuspenseQuery>;
export type HmisListClientsQueryResult = Apollo.QueryResult<HmisListClientsQuery, HmisListClientsQueryVariables>;