import { useMutation } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { Dispatch, SetStateAction } from 'react';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../../lib/screenRouting';
import { useSnackbar } from '../../../../../hooks';
import { ClientProfileDocument } from '../../../../Client/__generated__/Client.generated';
import { DeleteButton } from '../DeleteButton';
import { DeleteHmisProfileDocument } from './__generated__/deleteHmisProfile.generated';

const deleteableItemName = 'HMIS ID';

type TProps = {
  relationId: string;
  clientProfileId: string;
  disabled?: boolean;
  setIsLoading?: Dispatch<SetStateAction<boolean>>;
};

export function HmisProfileDeleteBtn(props: TProps) {
  const { clientProfileId, disabled, relationId, setIsLoading } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [deleteHmisProfile, { loading, error }] = useMutation(
    DeleteHmisProfileDocument
  );

  const onDelete = async () => {
    try {
      setIsLoading && setIsLoading(true);

      await deleteHmisProfile({
        variables: {
          id: relationId,
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

      const returnRoute = getViewClientProfileRoute({
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
    } finally {
      setIsLoading && setIsLoading(false);
    }
  };

  return (
    <DeleteButton
      disabled={loading || disabled}
      deleteableItemName={deleteableItemName}
      onDelete={onDelete}
    />
  );
}
