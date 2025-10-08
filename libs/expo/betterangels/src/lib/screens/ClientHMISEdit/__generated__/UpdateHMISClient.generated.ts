import * as Types from '../../../apollo/graphql/__generated__/types';

import * as Apollo from '@apollo/client';
import { gql } from '@apollo/client';
const defaultOptions = {} as const;
export type HmisUpdateClientMutationVariables = Types.Exact<{
  clientInput: Types.HmisUpdateClientInput;
  clientSubItemsInput: Types.HmisUpdateClientSubItemsInput;
}>;

export type HmisUpdateClientMutation = {
  __typename?: 'Mutation';
  hmisUpdateClient:
    | {
        __typename?: 'HmisClientType';
        personalId?: string | null;
        uniqueIdentifier?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        nameDataQuality?: Types.HmisNameQualityEnum | null;
        ssn1?: string | null;
        ssn2?: string | null;
        ssn3?: string | null;
        ssnDataQuality?: Types.HmisSsnQualityEnum | null;
        dob?: string | null;
        dobDataQuality?: Types.HmisDobQualityEnum | null;
        data?: {
          __typename?: 'HmisClientDataType';
          middleName?: string | null;
          nameSuffix?: Types.HmisSuffixEnum | null;
          alias?: string | null;
          raceEthnicity: Array<Types.HmisRaceEnum>;
          additionalRaceEthnicity?: string | null;
          differentIdentityText?: string | null;
          gender: Array<Types.HmisGenderEnum>;
          veteranStatus: Types.HmisVeteranStatusEnum;
        } | null;
      }
    | {
        __typename?: 'HmisUpdateClientError';
        message: string;
        field?: string | null;
      };
};

export const HmisUpdateClientDocument = gql`
  mutation hmisUpdateClient(
    $clientInput: HmisUpdateClientInput!
    $clientSubItemsInput: HmisUpdateClientSubItemsInput!
  ) {
    hmisUpdateClient(
      clientInput: $clientInput
      clientSubItemsInput: $clientSubItemsInput
    ) {
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
      ... on HmisUpdateClientError {
        message
        field
      }
    }
  }
`;
export type HmisUpdateClientMutationFn = Apollo.MutationFunction<
  HmisUpdateClientMutation,
  HmisUpdateClientMutationVariables
>;

/**
 * __useHmisUpdateClientMutation__
 *
 * To run a mutation, you first call `useHmisUpdateClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useHmisUpdateClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [hmisUpdateClientMutation, { data, loading, error }] = useHmisUpdateClientMutation({
 *   variables: {
 *      clientInput: // value for 'clientInput'
 *      clientSubItemsInput: // value for 'clientSubItemsInput'
 *   },
 * });
 */
export function useHmisUpdateClientMutation(
  baseOptions?: Apollo.MutationHookOptions<
    HmisUpdateClientMutation,
    HmisUpdateClientMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    HmisUpdateClientMutation,
    HmisUpdateClientMutationVariables
  >(HmisUpdateClientDocument, options);
}
export type HmisUpdateClientMutationHookResult = ReturnType<
  typeof useHmisUpdateClientMutation
>;
export type HmisUpdateClientMutationResult =
  Apollo.MutationResult<HmisUpdateClientMutation>;
export type HmisUpdateClientMutationOptions = Apollo.BaseMutationOptions<
  HmisUpdateClientMutation,
  HmisUpdateClientMutationVariables
>;
