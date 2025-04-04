import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useSnackbar } from '../../../../../hooks';
import {
  ClientProfileSectionEnum,
  getClientProfileRoute,
} from '../../../../../screenRouting';
import { ClientProfileDocument } from '../../../../Client/__generated__/Client.generated';
import { DeleteButton } from '../DeleteButton';
import { useDeleteHmisProfileMutation } from './__generated__/hmisProfile.generated';

const deleteableItemName = 'HMIS ID';

type TProps = {
  relationId: string;
  clientProfileId: string;
};

export function HmisProfileDelete(props: TProps) {
  const { clientProfileId, relationId } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [deleteHmisProfile, { loading, error }] =
    useDeleteHmisProfileMutation();

  const onDelete = async () => {
    try {
      await deleteHmisProfile({
        variables: {
          id: relationId as string,
        },
        refetchQueries: [
          {
            query: ClientProfileDocument,
            variables: {
              id: clientProfileId,
            },
          },
        ],
      });

      if (error) {
        throw error;
      }

      const returnRoute = getClientProfileRoute({
        id: clientProfileId,
        openCard: ClientProfileSectionEnum.HmisIds,
      });

      router.replace(returnRoute);
    } catch (e) {
      console.error('Error deleting HMIS ID:', e);

      showSnackbar({
        message: 'Something went wrong. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <>
      <DeleteButton
        disabled={loading}
        deleteableItemName={deleteableItemName}
        onDelete={onDelete}
      />

      {!!loading && <LoadingView fullScreen={true} />}
    </>
  );
}
