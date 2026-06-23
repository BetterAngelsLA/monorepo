import { useMutation } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from '../useShelterOperatorProfile/__generated__/useShelterOperatorProfile.generated';
import {
  DeleteShelterPhotosDocument,
  DeleteShelterPhotosMutation,
  DeleteShelterPhotosMutationVariables,
} from './__generated__/useDeleteShelterPhotos.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useDeleteShelterPhotos(props: TProps) {
  const { shelterId, refetch = true } = props;

  const [deleteShelterPhotos, { loading, error }] = useMutation<
    DeleteShelterPhotosMutation,
    DeleteShelterPhotosMutationVariables
  >(DeleteShelterPhotosDocument, {
    refetchQueries: refetch
      ? [
          {
            query: GetShelterOperatorProfileDocument,
            variables: { id: shelterId },
          },
        ]
      : [],
  });

  return { deleteShelterPhotos, loading, error };
}
