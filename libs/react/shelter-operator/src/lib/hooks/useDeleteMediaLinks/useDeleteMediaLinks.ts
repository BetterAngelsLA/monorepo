import { useMutation } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from '../useShelterOperatorProfile/__generated__/useShelterOperatorProfile.generated';
import { DeleteMediaLinksDocument } from './__generated__/useDeleteMediaLinks.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useDeleteMediaLinks(props: TProps) {
  const { shelterId, refetch = true } = props;

  const [deleteMediaLinks, { loading, error }] = useMutation(
    DeleteMediaLinksDocument,
    {
      refetchQueries: refetch
        ? [
            {
              query: GetShelterOperatorProfileDocument,
              variables: { id: shelterId },
            },
          ]
        : [],
    },
  );

  return { deleteMediaLinks, loading, error };
}
