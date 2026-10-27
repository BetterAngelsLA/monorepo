import { useMutation } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from '../useShelterOperatorProfile/__generated__/useShelterOperatorProfile.generated';
import { UpdateMediaLinkDocument } from './__generated__/useUpdateMediaLink.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useUpdateMediaLink(props: TProps) {
  const { shelterId, refetch = true } = props;

  const [updateMediaLink, { loading, error }] = useMutation(
    UpdateMediaLinkDocument,
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

  return { updateMediaLink, loading, error };
}
