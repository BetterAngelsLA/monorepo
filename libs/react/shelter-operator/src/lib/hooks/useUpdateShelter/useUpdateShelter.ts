import { useMutation } from '@apollo/client/react';
import { GetShelterDocument } from '../../graphql/__generated__/getShelter.generated';
import {
  UpdateShelterDocument,
  type UpdateShelterMutation,
  type UpdateShelterMutationVariables,
} from './__generated__/useUpdateShelter.generated';

type TProps = {
  refetch?: boolean;
};

export function useUpdateShelter(props?: TProps) {
  const { refetch = true } = props || {};

  const [updateShelter, { loading, error }] = useMutation<
    UpdateShelterMutation,
    UpdateShelterMutationVariables
  >(UpdateShelterDocument, {
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.updateShelter;

          if (payload?.__typename === 'ShelterType') {
            return [
              { query: GetShelterDocument, variables: { id: payload.id } },
            ];
          }

          return [];
        }
      : [],
  });

  return { updateShelter, loading, error };
}
