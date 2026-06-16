import { useMutation } from '@apollo/client/react';
import { GetAdminShelterProfileDocument } from '../useAdminShelterProfile/__generated__/useAdminShelterProfile.generated';
import {
  DeleteShelterPhotoDocument,
  DeleteShelterPhotoMutation,
  DeleteShelterPhotoMutationVariables,
} from './__generated__/useDeleteShelterPhoto.generated';

export function useDeleteShelterPhoto(shelterId: string) {
  const [deleteShelterPhoto, { loading, error }] = useMutation<
    DeleteShelterPhotoMutation,
    DeleteShelterPhotoMutationVariables
  >(DeleteShelterPhotoDocument, {
    refetchQueries: [
      {
        query: GetAdminShelterProfileDocument,
        variables: { id: shelterId },
      },
    ],
  });

  return { deleteShelterPhoto, loading, error };
}
