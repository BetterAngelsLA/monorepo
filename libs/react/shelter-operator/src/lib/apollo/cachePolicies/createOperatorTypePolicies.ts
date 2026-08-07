import { TypePolicies } from '@apollo/client';
// example: import typenames as safe constants to prevent drift
// import { OPERATOR_SHELTER_TYPENAME } from '../../hooks/useShelterOperatorProfile/constants';

/**
 * Cache type policies scoped to the shelter-operator domain.
 * Pass the result to {@link createShelterTypePolicies} as {@code extraPolicies}.
 */
export function createOperatorTypePolicies(): TypePolicies {
  return {
    // example: this particular case is not necessary as keyFields: ['id']
    //    is Apollo's default for any type with an id field
    // [OPERATOR_SHELTER_TYPENAME]: {
    //   keyFields: ['id'],
    // },
  };
}
