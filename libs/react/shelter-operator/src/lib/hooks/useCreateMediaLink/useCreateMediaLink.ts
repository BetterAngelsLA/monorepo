import { useMutation } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from '../useShelterOperatorProfile/__generated__/useShelterOperatorProfile.generated';
import {
  CreateMediaLinkDocument,
  CreateMediaLinkMutation,
  CreateMediaLinkMutationVariables,
} from './__generated__/useCreateMediaLink.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useCreateMediaLink(props: TProps) {
  const { shelterId, refetch = true } = props;

  const [createMediaLink, { loading, error }] = useMutation<
    CreateMediaLinkMutation,
    CreateMediaLinkMutationVariables
  >(CreateMediaLinkDocument, {
    refetchQueries: refetch
      ? [
          {
            query: GetShelterOperatorProfileDocument,
            variables: { id: shelterId },
          },
        ]
      : [],
  });

  return { createMediaLink, loading, error };
}
