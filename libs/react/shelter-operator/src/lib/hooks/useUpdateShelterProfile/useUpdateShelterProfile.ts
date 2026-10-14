import { useMutation } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from '../useShelterOperatorProfile/__generated__/useShelterOperatorProfile.generated';
import {
  UpdateShelterProfileDocument,
  UpdateShelterProfileMutation,
  UpdateShelterProfileMutationVariables,
} from './__generated__/useUpdateShelterProfile.generated';
import { updateShelterProfileSuccessTypename } from './__generated__/useUpdateShelterProfile_meta.generated';

type TProps = {
  refetch?: boolean;
};

/**
 * Mutation hook for updating the fairly static shelter profile data (name, address, general info).
 *
 * By default, automatically refetches {@link GetShelterOperatorProfileDocument} after a
 * successful update so the UI stays in sync. Pass `refetch: false` to suppress this
 * if the caller manages cache updates itself.
 *
 * For mutations that affect dynamic operational data (e.g. bed/room inventory),
 * use a separate dedicated hook rather than extending this one.
 */
export function useUpdateShelterProfile(props?: TProps) {
  const { refetch = true } = props || {};

  const [updateShelter, { loading, error }] = useMutation<
    UpdateShelterProfileMutation,
    UpdateShelterProfileMutationVariables
  >(UpdateShelterProfileDocument, {
    awaitRefetchQueries: true,
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.updateShelter;

          if (payload?.__typename === updateShelterProfileSuccessTypename) {
            return [
              {
                query: GetShelterOperatorProfileDocument,
                variables: { id: payload.id },
              },
            ];
          }

          return [];
        }
      : [],
  });

  return { updateShelter, loading, error };
}
