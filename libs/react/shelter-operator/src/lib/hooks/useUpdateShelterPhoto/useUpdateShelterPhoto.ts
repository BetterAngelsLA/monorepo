import { useMutation } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from '../useShelterOperatorProfile/__generated__/useShelterOperatorProfile.generated';
import {
  UpdateShelterPhotoDocument,
  UpdateShelterPhotoMutation,
  UpdateShelterPhotoMutationVariables,
} from './__generated__/useUpdateShelterPhoto.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useUpdateShelterPhoto(props: TProps) {
  const { shelterId, refetch = true } = props;

  const [updateShelterPhoto, { loading, error }] = useMutation<
    UpdateShelterPhotoMutation,
    UpdateShelterPhotoMutationVariables
  >(UpdateShelterPhotoDocument, {
    refetchQueries: refetch
      ? [
          {
            query: GetShelterOperatorProfileDocument,
            variables: { id: shelterId },
          },
        ]
      : [],
  });

  return { updateShelterPhoto, loading, error };
}
