import { useMutation } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { Dispatch, SetStateAction } from 'react';
import {
  ClientProfileSectionEnum,
  getViewClientProfileRoute,
} from '../../../../../../lib/screenRouting';
import {
  OperationMessageKind,
  extractOperationInfoMessages,
} from '../../../../../apollo';
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
  console.log('################################### ClientContactDeleteBtn');
  const { clientProfileId, disabled, relationId, setIsLoading } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [deleteClientContact, { loading }] = useMutation(
    DeleteClientContactDocument
  );

  const onDelete = async () => {
    try {
      setIsLoading && setIsLoading(true);

      const response = await deleteClientContact({
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

      const { error } = response;

      if (error) {
        throw new Error(error.message);
      }

      const operationErrors = extractOperationInfoMessages(
        response,
        'deleteClientContact',
        [
          OperationMessageKind.Error,
          OperationMessageKind.Validation,
          OperationMessageKind.Permission,
        ]
      );

      if (operationErrors?.length) {
        const errMessage = operationErrors.map((e) => e.message).join(', ');

        throw new Error(errMessage);
      }

      const returnRoute = getViewClientProfileRoute({
        id: clientProfileId,
        openCard: ClientProfileSectionEnum.RelevantContacts,
      });

      router.replace(returnRoute);
    } catch (e) {
      console.error(
        `Error deleting Relevant Contact Id [${relationId}] for clientProfileId [${clientProfileId}]: ${e}`
      );

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
