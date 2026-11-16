import { TypePolicies } from '@apollo/client';
// example: import typenames as safe constants to prevent drift
// import { OPERATOR_SHELTER_TYPENAME } from '../../hooks/useShelterOperatorProfile/constants';

/**
 * Cache type policies scoped to the shelter-operator domain.
 * Pass the result to {@link createShelterTypePolicies} as {@code extraPolicies}.
 */
export function createOperatorTypePolicies(): TypePolicies {
  return {
    // `AuditActorType.label` is computed inside one object's history (the most
    // frequent frozen name/email for that actor *in that log*), so the same
    // user id can legitimately carry different labels in two logs. Apollo's
    // default `__typename:id` key would let the last write win, so the record
    // is embedded per query instead of normalized.
    AuditActorType: { keyFields: false },
    // example: this particular case is not necessary as keyFields: ['id']
    //    is Apollo's default for any type with an id field
    // [OPERATOR_SHELTER_TYPENAME]: {
    //   keyFields: ['id'],
    // },
  };
}
