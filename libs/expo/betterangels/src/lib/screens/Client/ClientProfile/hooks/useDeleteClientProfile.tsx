import { useRouter } from 'expo-router';
import { useSnackbar } from '../../../../hooks';
import { useDeleteClientProfileMutation } from '../../../ClientProfileForms/ClientProfileForm/__generated__/clientProfile.generated';

export function useDeleteClientProfile(clientProfileId?: string) {
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

      const returnRoute = {
        pathname: '/',
      };

      router.replace(returnRoute);
    } catch (e) {
      console.error(
        `Error deleting Client Profile Id ${clientProfileId}: ${e}`
      );
      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
      throw e;
    }
  };

  return {
    deleteProfile,
    loading,
  };
}
