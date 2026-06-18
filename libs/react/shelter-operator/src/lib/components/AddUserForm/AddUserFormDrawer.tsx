import { Modal, ModalHeader, ModalBody } from '../base-ui/modal';
import { Text } from '../base-ui/text/text';
import { AddUserForm } from './AddUserForm';
import { OrganizationMemberType } from '../../apollo/graphql/__generated__/types';
import { useActiveOrg } from '../../providers';

type TProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AddUserFormDrawer(props: TProps) {
  const { isOpen, onClose, onSuccess } = props;
  const { activeOrg } = useActiveOrg();

  const organizationId = activeOrg?.id;

  function handleOnComplete(_invitedUser: OrganizationMemberType) {
    onSuccess?.();
    onClose();
  }

  function handleOnCancel() {
    onClose();
  }

  if (!organizationId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <Text variant="header-md" className="font-semibold text-[#383B40]">
          Add User
        </Text>
      </ModalHeader>

      <ModalBody>
        <AddUserForm
          organizationId={organizationId}
          onComplete={handleOnComplete}
          onCancel={handleOnCancel}
        />
      </ModalBody>
    </Modal>
  );
}
