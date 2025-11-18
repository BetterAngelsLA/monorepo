import { useMutationWithErrors } from '@monorepo/apollo';
import { useRouter } from 'expo-router';
import { Dispatch, SetStateAction } from 'react';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../../lib/screenRouting';
import { useSnackbar } from '../../../../../hooks';
import { ClientProfileDocument } from '../../../../Client/__generated__/Client.generated';
import { DeleteButton } from '../DeleteButton';
import { DeleteClientContactDocument } from './__generated__/deleteClientContact.generated';

const deleteableItemName = 'Relevant Contact';

type TProps = {
  relationId: string;
  clientProfileId: string;
  disabled?: boolean;
  setIsLoading?: Dispatch<SetStateAction<boolean>>;
};

export function ClientContactDeleteBtn(props: TProps) {
  const { clientProfileId, disabled, relationId, setIsLoading } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [deleteClientContact, { loading }] = useMutationWithErrors(
    DeleteClientContactDocument
  );

  const onDelete = async () => {
    try {
      setIsLoading && setIsLoading(true);

      const { errors } = await deleteClientContact({
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
        errorPolicy: 'all',
      });

      if (errors?.length) {
        throw errors[0];
      }

      const returnRoute = getViewClientProfileRoute({
        id: clientProfileId,
        openCard: ClientProfileSectionEnum.RelevantContacts,
      });

      router.replace(returnRoute);
    } catch (e) {
      console.error('Error deleting Relevant Contact:', e);

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
      deleteableItemNameBody={deleteableItemName.toLowerCase()}
      onDelete={onDelete}
    />
  );
}
