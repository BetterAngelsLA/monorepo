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
import { DeleteClientHouseholdMemberDocument } from './__generated__/deleteHouseholdMember.generated';

const deleteableItemName = 'Household Member';

type TProps = {
  relationId: string;
  clientProfileId: string;
  disabled?: boolean;
  setIsLoading?: Dispatch<SetStateAction<boolean>>;
};

export function HouseholdMemeberDeleteBtn(props: TProps) {
  const { clientProfileId, disabled, relationId, setIsLoading } = props;

  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [deleteHouseholdMember, { loading, error }] = useMutation(
    DeleteClientHouseholdMemberDocument
  );

  const onDelete = async () => {
    try {
      setIsLoading && setIsLoading(true);

      await deleteHouseholdMember({
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
        openCard: ClientProfileSectionEnum.Household,
      });

      router.replace(returnRoute);
    } catch (e) {
      console.error('Error deleting Household Member:', e);

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
