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
