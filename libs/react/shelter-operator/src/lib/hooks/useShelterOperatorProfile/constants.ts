import type { OperatorShelterTypename } from './types';

/**
 * Verified against the generated query type at compile time — if the
 * backend renames `OperatorShelterType`, the build fails.
 */
export const OPERATOR_SHELTER_TYPENAME: OperatorShelterTypename =
  'OperatorShelterType';
