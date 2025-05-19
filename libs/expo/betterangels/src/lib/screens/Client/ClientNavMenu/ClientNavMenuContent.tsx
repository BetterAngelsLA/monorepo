import { DeleteIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { useDeleteClientProfile } from '../ClientProfile/hooks/useDeleteClientProfile';
import { ClientNavMenuBtn } from './ClientNavMenuBtn';

type TProps = {
  clientProfileId?: string;
  onItemClick?: () => void;
};

export function ClientNavMenuContent(props: TProps) {
  const { clientProfileId, onItemClick } = props;

  const { deleteProfile, loading: isDeleting } = useDeleteClientProfile({
    clientProfileId,
  });

  const onDeleteClientProfile = async () => {
    if (!clientProfileId || isDeleting) {
      return;
    }

    await deleteProfile(clientProfileId);
  };

  return (
    <>
      {clientProfileId && (
        <DeleteModal
          title="Delete Profile?"
          body="All data associated with this client will be deleted. This action cannot be undone."
          onDelete={() => {
            onItemClick?.();
            onDeleteClientProfile();
          }}
          button={
            <ClientNavMenuBtn
              disabled={isDeleting}
              text="Delete Profile"
              accessibilityHint="delete client profile"
              color={Colors.ERROR}
              icon={<DeleteIcon color={Colors.ERROR} size="sm" />}
            />
          }
        />
      )}
    </>
  );
}
