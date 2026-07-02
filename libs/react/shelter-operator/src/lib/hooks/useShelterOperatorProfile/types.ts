import { GetShelterOperatorProfileQuery } from './__generated__/useShelterOperatorProfile.generated';

export type UseShelterOperatorProfileResultType =
  GetShelterOperatorProfileQuery['operatorShelter'];

/**
 * Extracted from the generated query type so the runtime constant in
 * `constants.ts` is compile-time verified. If the backend renames
 * the GraphQL type, this breaks the build rather than silently drifting.
 */
export type OperatorShelterTypename = NonNullable<
  NonNullable<GetShelterOperatorProfileQuery['operatorShelter']>['__typename']
>;
