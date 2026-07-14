import { useMutation } from '@apollo/client/react';
import { CreateBedInput } from '../../apollo';
import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import {
  CreateBedDocument,
  CreateBedMutation,
  CreateBedMutationVariables,
} from './__generated__/useCreateBed.generated';
import { createBedSuccessTypename } from './__generated__/useCreateBed_meta.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export type UseCreateBedInput = CreateBedInput;

export function useCreateBed(props: TProps) {
  const { shelterId, refetch = true } = props || {};

  const [createBed, { loading, error }] = useMutation<
    CreateBedMutation,
    CreateBedMutationVariables
  >(CreateBedDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.createBed;

          if (payload?.__typename === createBedSuccessTypename) {
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

  return { createBed, loading, error };
}
