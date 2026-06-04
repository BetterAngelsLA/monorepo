import { useMutation } from '@apollo/client/react';
import { GetAdminShelterProfileDocument } from '../useAdminShelterProfile/__generated__/useAdminShelterProfile.generated';
import {
  UpdateShelterProfileDocument,
  UpdateShelterProfileMutation,
  UpdateShelterProfileMutationVariables,
} from './__generated__/useUpdateShelterProfile.generated';

type TProps = {
  refetch?: boolean;
};

export function useUpdateShelterProfile(props?: TProps) {
  const { refetch = true } = props || {};

  const [updateShelter, { loading, error }] = useMutation<
    UpdateShelterProfileMutation,
    UpdateShelterProfileMutationVariables
  >(UpdateShelterProfileDocument, {
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.updateShelter;

          if (payload?.__typename === 'ShelterType') {
            return [
              {
                query: GetAdminShelterProfileDocument,
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
