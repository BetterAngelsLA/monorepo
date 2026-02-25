import { useMutation } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { useSnackbar } from '../../../../hooks';
import { DeleteClientProfileDocument } from '../../../ClientProfileForms/ClientProfileForm/__generated__/clientProfile.generated';

type TProps = {
  clientProfileId?: string;
  returnPath?: string | null;
};

export function useDeleteClientProfile(props: TProps) {
  const { clientProfileId, returnPath = '/' } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [deleteClientProfile, { loading }] = useMutation(
    DeleteClientProfileDocument
  );

  const deleteProfile = async (id: string) => {
    try {
      await deleteClientProfile({
        variables: { id },
        update(cache) {
          if (!id) {
            return;
          }

          // Remove from all clientProfiles list entries
          cache.modify({
            id: 'ROOT_QUERY',
            fields: {
              clientProfiles(existing, { readField }) {
                if (!existing) {
                  return existing;
                }

                const existingResults = existing.results ?? [];

                const nextResults = existingResults.filter((ref: any) => {
                  const refId = readField('id', ref);

                  // remove any dangling refs
                  if (refId === null || refId === undefined) {
                    return false;
                  }

                  return refId !== id;
                });

                const nextTotal =
                  typeof existing.totalCount === 'number'
                    ? Math.max(0, existing.totalCount - 1)
                    : existing.totalCount;

                return {
                  ...existing,
                  results: nextResults,
                  totalCount: nextTotal,
                };
              },
            },
          });

          // Evict after
          const storeId = cache.identify({
            __typename: 'ClientProfileType',
            id,
          });

          if (storeId) {
            cache.evict({ id: storeId });
          }

          cache.gc();
        },
      });

      if (returnPath) {
        router.replace({
          pathname: returnPath,
        });
      }
    } catch (e) {
      console.error(
        `Error deleting Client Profile Id ${clientProfileId}: ${e}`
      );

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return {
    deleteProfile,
    loading,
  };
}
