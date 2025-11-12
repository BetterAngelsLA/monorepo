import { DeleteIcon } from '@monorepo/expo/shared/icons';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { useSnackbar } from '../../../hooks';
import { MainModal } from '../../../ui-components/MainModal';
import {
  useUpdateClientProfileMutation,
} from '../../ClientProfileForms/ClientProfileForm/__generated__/clientProfile.generated';
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [shouldShowDeleteModal, setShouldShowDeleteModal] = useState(false);

  // Reset deleteModalVisible when the main modal closes
  useEffect(() => {
    if (!isModalVisible) {
      setDeleteModalVisible(false);
      setShouldShowDeleteModal(false);
    }
  }, [isModalVisible]);

  // Delay mounting DeleteModal to allow MainModal to fully close
  useEffect(() => {
    if (deleteModalVisible) {
      const timer = setTimeout(() => {
        setShouldShowDeleteModal(true);
      }, 350);
      return () => clearTimeout(timer);
    }
    setShouldShowDeleteModal(false);
    return undefined;
  }, [deleteModalVisible]);

  const [updateClientProfile] = useUpdateClientProfileMutation({
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

  const deleteFile = async () => {
    setDeleteModalVisible(false);
    closeModal();
    try {
      await updateClientProfile({
        variables: {
          data: {
            id: clientId,
            profilePhoto: null,
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

  const ACTIONS = [
    {
      title: 'Delete image',
      Icon: DeleteIcon,
      onPress: () => setDeleteModalVisible(true),
    },
  ];

  return shouldShowDeleteModal ? (
    <DeleteModal
      body="All data associated with this image will be deleted."
      title="Delete image?"
      onDelete={deleteFile}
      onCancel={() => setDeleteModalVisible(false)}
      isVisible
      deleteableItemName="profile photo"
    />
  ) : (
    <MainModal
      closeButton
      vertical
      actions={ACTIONS}
      isModalVisible={isModalVisible && !deleteModalVisible}
      closeModal={closeModal}
      opacity={0.5}
    />
  );
}
