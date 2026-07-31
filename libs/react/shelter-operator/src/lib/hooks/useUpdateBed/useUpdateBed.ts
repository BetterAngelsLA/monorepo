import { useMutation } from '@apollo/client/react';
import { UpdateBedInput } from '../../apollo';
import { BedDocument } from '../useBed/__generated__/useBed.generated';
import {
  UpdateBedDocument,
  UpdateBedMutation,
  UpdateBedMutationVariables,
} from './__generated__/useUpdateBed.generated';
import { updateBedSuccessTypename } from './__generated__/useUpdateBed_meta.generated';

type TProps = {
  refetch?: boolean;
};

export type UseUpdateBedInput = UpdateBedInput;

export function useUpdateBed(props?: TProps) {
  const { refetch = true } = props || {};

  const [updateBed, { loading, error }] = useMutation<
    UpdateBedMutation,
    UpdateBedMutationVariables
  >(UpdateBedDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.updateBed;

          if (payload?.__typename === updateBedSuccessTypename) {
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

  return { updateBed, loading, error };
}
