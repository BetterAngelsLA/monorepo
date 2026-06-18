import { useMutation } from '@apollo/client/react';
import { GetAdminShelterProfileDocument } from '../useAdminShelterProfile/__generated__/useAdminShelterProfile.generated';
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
            query: GetAdminShelterProfileDocument,
            variables: { id: shelterId },
          },
        ]
      : [],
  });

  return { updateShelterPhoto, loading, error };
}
