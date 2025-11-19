import { useMutation } from '@apollo/client/react';
import { DeleteIcon, ViewIcon } from '@monorepo/expo/shared/icons';
import { BaseModal, DeleteModal, DUR_OUT, ImageViewer } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

type ModalType = 'viewer' | 'delete';

export function ProfilePhotoModal({
  isModalVisible,
  closeModal,
  imageUrl,
  clientId,
}: IProfilePhotoModalProps) {
  const { showSnackbar } = useSnackbar();
  const [currentModal, setCurrentModal] = useState<ModalType | null>(null);
  const [nextModal, setNextModal] = useState<ModalType | null>(null);

  // Handle modal state transitions and resets
  useEffect(() => {
    if (isModalVisible) {
      // Reset state when main modal opens
      setCurrentModal(null);
      setNextModal(null);
      return undefined;
    }

    // Handle transition when main modal closes and we have a next modal queued
    if (nextModal) {
      // Delay to ensure MainModal animation completes (DUR_OUT + buffer)
      const timer = setTimeout(() => {
        setCurrentModal(nextModal);
        setNextModal(null);
      }, DUR_OUT + 150);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isModalVisible, nextModal]);

  const [updateClientProfilePhoto] = useMutation(
    UpdateClientProfilePhotoDocument,
    {
      refetchQueries: [
        { query: ClientProfileDocument, variables: { id: clientId } },
      ],
    }
  );

  const deleteFile = async () => {
    setCurrentModal(null);
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
    setNextModal('delete');
    closeModal();
  };

  const handleViewImagePress = () => {
    setNextModal('viewer');
    closeModal();
  };

  const ACTIONS = [
    {
      title: 'View image',
      Icon: ViewIcon,
      onPress: handleViewImagePress,
    },
    {
      title: 'Delete image',
      Icon: DeleteIcon,
      onPress: handleDeletePress,
    },
  ];

  if (currentModal === 'delete') {
    return (
      <DeleteModal
        body="All data associated with this image will be deleted."
        title="Delete image?"
        onDelete={deleteFile}
        onCancel={() => setCurrentModal(null)}
        isVisible
        deleteableItemName="profile photo"
      />
    );
  }

  if (currentModal === 'viewer') {
    if (!imageUrl) {
      return null;
    }

    return (
      <BaseModal
        title="Profile Photo"
        isOpen={true}
        onClose={() => {
          setCurrentModal(null);
          closeModal();
        }}
        variant="fullscreen"
      >
        <View style={styles.container}>
          <ImageViewer url={imageUrl} />
        </View>
      </BaseModal>
    );
  }

  return (
    <MainModal
      closeButton
      vertical
      actions={ACTIONS}
      isModalVisible={isModalVisible && !nextModal}
      closeModal={closeModal}
      opacity={0.5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
