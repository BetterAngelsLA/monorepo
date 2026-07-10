import { useMutation } from '@apollo/client/react';
import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import {
  CloneBedDocument,
  CloneBedMutation,
  CloneBedMutationVariables,
} from './__generated__/useCloneBed.generated';
import { cloneBedSuccessTypename } from './__generated__/useCloneBed_meta.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useCloneBed(props: TProps) {
  const { shelterId, refetch = true } = props;

  const [cloneBed, { loading, error }] = useMutation<
    CloneBedMutation,
    CloneBedMutationVariables
  >(CloneBedDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.cloneBed;

          if (payload?.__typename === cloneBedSuccessTypename) {
            return [
              {
                query: BedsDocument,
                variables: { shelterId },
              },
            ];
          }

          return [];
        }
      : [],
  });

  return { cloneBed, loading, error };
}
