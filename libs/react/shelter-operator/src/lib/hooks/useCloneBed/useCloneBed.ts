import { useMutation } from '@apollo/client/react';
import { BedDocument } from '../useBed/__generated__/useBed.generated';
import {
  CloneBedDocument,
  CloneBedMutation,
  CloneBedMutationVariables,
} from './__generated__/useCloneBed.generated';

type TProps = {
  refetch?: boolean;
};

export function useCloneBed(props?: TProps) {
  const { refetch = true } = props || {};

  const [cloneBed, { loading, error }] = useMutation<
    CloneBedMutation,
    CloneBedMutationVariables
  >(CloneBedDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.cloneBed;

          if (payload?.__typename === 'BedType') {
            return [
              {
                query: BedDocument,
                variables: { id: payload.id },
              },
            ];
          }

          return [];
        }
      : [],
  });

  return { cloneBed, loading, error };
}
