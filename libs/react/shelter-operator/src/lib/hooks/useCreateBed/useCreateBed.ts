import { useMutation } from '@apollo/client/react';
import { CreateBedInput } from '../../apollo';
import { BedDocument } from '../useBed/__generated__/useBed.generated';
import {
  CreateBedDocument,
  CreateBedMutation,
  CreateBedMutationVariables,
} from './__generated__/useCreateBed.generated';

type TProps = {
  refetch?: boolean;
};

export type UseCreateBedInput = CreateBedInput;

export function useCreateBed(props?: TProps) {
  const { refetch = true } = props || {};

  const [createBed, { loading, error }] = useMutation<
    CreateBedMutation,
    CreateBedMutationVariables
  >(CreateBedDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.createBed;

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

  return { createBed, loading, error };
}
