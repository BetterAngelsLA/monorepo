import * as Types from '../../../apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateHmisClientMutationVariables = Types.Exact<{
  clientInput: Types.HmisCreateClientInput;
  clientSubItemsInput: Types.HmisCreateClientSubItemsInput;
}>;


export type CreateHmisClientMutation = { __typename?: 'Mutation', hmisCreateClient: { __typename?: 'HmisClientType', personalId?: string | null, uniqueIdentifier?: string | null, firstName?: string | null, lastName?: string | null, nameDataQuality?: Types.HmisNameQualityEnum | null, ssn1?: string | null, ssn2?: string | null, ssn3?: string | null, ssnDataQuality?: Types.HmisSsnQualityEnum | null, dob?: string | null, dobDataQuality?: Types.HmisDobQualityEnum | null, data?: { __typename?: 'HmisClientDataType', middleName?: string | null, nameSuffix?: Types.HmisSuffixEnum | null, alias?: string | null, raceEthnicity: Array<Types.HmisRaceEnum>, additionalRaceEthnicity?: string | null, differentIdentityText?: string | null, gender: Array<Types.HmisGenderEnum>, veteranStatus: Types.HmisVeteranStatusEnum } | null } | { __typename?: 'HmisCreateClientError', message: string, field?: string | null } };


export const CreateHmisClientDocument = gql`
    mutation CreateHmisClient($clientInput: HmisCreateClientInput!, $clientSubItemsInput: HmisCreateClientSubItemsInput!) {
  hmisCreateClient(
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
    ... on HmisCreateClientError {
      message
      field
    }
  }
}
    `;
export type CreateHmisClientMutationFn = Apollo.MutationFunction<CreateHmisClientMutation, CreateHmisClientMutationVariables>;

/**
 * __useCreateHmisClientMutation__
 *
 * To run a mutation, you first call `useCreateHmisClientMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateHmisClientMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createHmisClientMutation, { data, loading, error }] = useCreateHmisClientMutation({
 *   variables: {
 *      clientInput: // value for 'clientInput'
 *      clientSubItemsInput: // value for 'clientSubItemsInput'
 *   },
 * });
 */
export function useCreateHmisClientMutation(baseOptions?: Apollo.MutationHookOptions<CreateHmisClientMutation, CreateHmisClientMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateHmisClientMutation, CreateHmisClientMutationVariables>(CreateHmisClientDocument, options);
      }
export type CreateHmisClientMutationHookResult = ReturnType<typeof useCreateHmisClientMutation>;
export type CreateHmisClientMutationResult = Apollo.MutationResult<CreateHmisClientMutation>;
export type CreateHmisClientMutationOptions = Apollo.BaseMutationOptions<CreateHmisClientMutation, CreateHmisClientMutationVariables>;