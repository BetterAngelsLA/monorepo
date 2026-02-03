import { useRouter } from 'expo-router';
import { useSnackbar } from '../../../../hooks';
import { useDeleteClientProfileMutation } from '../../../ClientProfileForms/ClientProfileForm/__generated__/clientProfile.generated';

type TProps = {
  clientProfileId?: string;
  returnPath?: string | null;
};

export function useDeleteClientProfile(props: TProps) {
  const { clientProfileId, returnPath = '/' } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [deleteClientProfile, { loading, error }] =
    useDeleteClientProfileMutation();

  const deleteProfile = async (id: string) => {
    try {
      await deleteClientProfile({
        variables: { id },
        update(cache) {
          if (!id) return;
          const storeId = cache.identify({ __typename: 'ClientProfile', id });

          if (storeId) cache.evict({ id: storeId });
          cache.modify({
            id: 'ROOT_QUERY',
            fields: {
              clientProfiles(existing, { readField }) {
                if (!existing) return existing;

                const nextResults = (existing.results ?? []).filter(
                  (ref: any) => readField('id', ref) !== id
                );

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

          cache.gc();
        },
      });

      if (error) {
        throw error;
      }

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
