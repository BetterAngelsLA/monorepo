import { UpdateShelterInput } from '@monorepo/react/shelter';
import type { UpdateShelterProfileMutation } from './__generated__/useUpdateShelterProfile.generated';

export type UseUpdateShelterProfileInput = UpdateShelterInput;

/** Compile-time guard — build fails if the backend renames the mutation field. */
export type OperationKey = keyof Omit<
  UpdateShelterProfileMutation,
  '__typename'
>;

/** Compile-time guard — build fails if the backend renames ShelterType. */
export type ShelterTypename = Extract<
  NonNullable<UpdateShelterProfileMutation['updateShelter']>,
  { __typename: 'ShelterType' }
>['__typename'];
