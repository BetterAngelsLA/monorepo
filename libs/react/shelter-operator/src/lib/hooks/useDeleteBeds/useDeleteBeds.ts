import { useMutation } from '@apollo/client/react';

import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import {
  DeleteBedsDocument,
  DeleteBedsMutation,
  DeleteBedsMutationVariables,
} from './__generated__/useDeleteBeds.generated';
import { deleteBedsSuccessTypename } from './__generated__/useDeleteBeds_meta.generated';

type TProps = {
  refetch?: boolean;
  shelterId: string;
};

export function useDeleteBeds(props: TProps) {
  const { refetch = true, shelterId } = props || {};

  const [deleteBeds, { loading, error }] = useMutation<
    DeleteBedsMutation,
    DeleteBedsMutationVariables
  >(DeleteBedsDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.deleteBeds;

          if (payload?.__typename === deleteBedsSuccessTypename) {
            return [{ query: BedsDocument, variables: { shelterId } }];
          }

          return [];
        }
      : [],
  });

  return { deleteBeds, loading, error };
}
