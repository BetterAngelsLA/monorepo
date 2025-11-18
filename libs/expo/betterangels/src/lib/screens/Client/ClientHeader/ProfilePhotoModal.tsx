import { useMutation } from '@apollo/client/react';
import { DeleteIcon } from '@monorepo/expo/shared/icons';
import { DeleteModal, DUR_OUT } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useSnackbar } from '../../../hooks';
import { MainModal } from '../../../ui-components/MainModal';
import { UpdateClientProfilePhotoDocument } from '../../ClientProfileForms/ClientProfileForm/PersonalInfoForm/ProfilePhotoField/__generated__/updateClientProfilePhoto.generated';
import { ClientProfileDocument } from '../__generated__/Client.generated';

interface IProfilePhotoModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  imageUrl: string;
  clientId: string;
}

export function ProfilePhotoModal({
  isModalVisible,
  closeModal,
  clientId,
}: IProfilePhotoModalProps) {
  const { showSnackbar } = useSnackbar();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  // Show delete modal after main modal closes (when pendingDelete is true)
  useEffect(() => {
    if (!isModalVisible && pendingDelete) {
      // Delay to ensure MainModal animation completes (DUR_OUT + buffer)
      const timer = setTimeout(() => {
        setShowDeleteModal(true);
        setPendingDelete(false);
      }, DUR_OUT + 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isModalVisible, pendingDelete]);

  // Reset state when modal is closed and we're not showing delete modal
  useEffect(() => {
    if (!isModalVisible && !pendingDelete && !showDeleteModal) {
      setShowDeleteModal(false);
      setPendingDelete(false);
    }
  }, [isModalVisible, pendingDelete, showDeleteModal]);

  const [updateClientProfilePhoto] = useMutation(
    UpdateClientProfilePhotoDocument,
    {
      refetchQueries: [
        { query: ClientProfileDocument, variables: { id: clientId } },
      ],
    }
  );

  const deleteFile = async () => {
    setShowDeleteModal(false);
    closeModal();
    try {
      await updateClientProfilePhoto({
        variables: {
          data: {
            clientProfile: clientId,
            photo: null,
          },
        },
      });
    } catch (err) {
      console.error('Error deleting profile photo', err);
      showSnackbar({
        message: 'An error occurred while deleting the profile photo',
        type: 'error',
      });
    }
  };

  const handleDeletePress = () => {
    setPendingDelete(true);
    closeModal();
  };

  const ACTIONS = [
    {
      title: 'Delete image',
      Icon: DeleteIcon,
      onPress: handleDeletePress,
    },
  ];

  if (showDeleteModal) {
    return (
      <DeleteModal
        body="All data associated with this image will be deleted."
        title="Delete image?"
        onDelete={deleteFile}
        onCancel={() => setShowDeleteModal(false)}
        isVisible
        deleteableItemName="profile photo"
      />
    );
  }

  return (
    <MainModal
      closeButton
      vertical
      actions={ACTIONS}
      isModalVisible={isModalVisible && !pendingDelete}
      closeModal={closeModal}
      opacity={0.5}
    />
  );
}
