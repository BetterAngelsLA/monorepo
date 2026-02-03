import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetHmisClientQueryVariables = Types.Exact<{
  personalId: Types.Scalars['ID']['input'];
}>;


export type GetHmisClientQuery = { __typename?: 'Query', hmisGetClient: { __typename: 'HmisClientType', personalId?: string | null, uniqueIdentifier?: string | null, firstName?: string | null, lastName?: string | null, nameDataQuality?: Types.HmisNameQualityEnum | null, ssn1?: string | null, ssn2?: string | null, ssn3?: string | null, ssnDataQuality?: Types.HmisSsnQualityEnum | null, dob?: string | null, dobDataQuality?: Types.HmisDobQualityEnum | null, data?: { __typename?: 'HmisClientDataType', middleName?: string | null, nameSuffix?: Types.HmisSuffixEnum | null, alias?: string | null, raceEthnicity: Array<Types.HmisRaceEnum>, additionalRaceEthnicity?: string | null, differentIdentityText?: string | null, gender: Array<Types.HmisGenderEnum>, veteranStatus: Types.HmisVeteranStatusEnum } | null } | { __typename: 'HmisGetClientError' } };


export const GetHmisClientDocument = gql`
    query GetHMISClient($personalId: ID!) {
  hmisGetClient(personalId: $personalId) {
    __typename
    ... on HmisClientType {
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
  }
}
    `;

/**
 * __useGetHmisClientQuery__
 *
 * To run a query within a React component, call `useGetHmisClientQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHmisClientQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHmisClientQuery({
 *   variables: {
 *      personalId: // value for 'personalId'
 *   },
 * });
 */
export function useGetHmisClientQuery(baseOptions: Apollo.QueryHookOptions<GetHmisClientQuery, GetHmisClientQueryVariables> & ({ variables: GetHmisClientQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetHmisClientQuery, GetHmisClientQueryVariables>(GetHmisClientDocument, options);
      }
export function useGetHmisClientLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetHmisClientQuery, GetHmisClientQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetHmisClientQuery, GetHmisClientQueryVariables>(GetHmisClientDocument, options);
        }
export function useGetHmisClientSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetHmisClientQuery, GetHmisClientQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetHmisClientQuery, GetHmisClientQueryVariables>(GetHmisClientDocument, options);
        }
export type GetHmisClientQueryHookResult = ReturnType<typeof useGetHmisClientQuery>;
export type GetHmisClientLazyQueryHookResult = ReturnType<typeof useGetHmisClientLazyQuery>;
export type GetHmisClientSuspenseQueryHookResult = ReturnType<typeof useGetHmisClientSuspenseQuery>;
export type GetHmisClientQueryResult = Apollo.QueryResult<GetHmisClientQuery, GetHmisClientQueryVariables>;