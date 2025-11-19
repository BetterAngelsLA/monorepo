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
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [pendingModal, setPendingModal] = useState<ModalType | null>(null);

  // Show modal after main modal closes (when pendingModal is set)
  useEffect(() => {
    if (!isModalVisible && pendingModal) {
      // Delay to ensure MainModal animation completes (DUR_OUT + buffer)
      const timer = setTimeout(() => {
        setActiveModal(pendingModal);
        setPendingModal(null);
      }, DUR_OUT + 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isModalVisible, pendingModal]);

  // Reset state when modal is closed and we're not showing another modal
  useEffect(() => {
    if (!isModalVisible && !pendingModal && !activeModal) {
      setActiveModal(null);
    }
  }, [isModalVisible, pendingModal, activeModal]);

  const [updateClientProfilePhoto] = useMutation(
    UpdateClientProfilePhotoDocument,
    {
      refetchQueries: [
        { query: ClientProfileDocument, variables: { id: clientId } },
      ],
    }
  );

  const deleteFile = async () => {
    setActiveModal(null);
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
    setPendingModal('delete');
    closeModal();
  };

  const handleViewImagePress = () => {
    setPendingModal('viewer');
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

  if (activeModal === 'delete') {
    return (
      <DeleteModal
        body="All data associated with this image will be deleted."
        title="Delete image?"
        onDelete={deleteFile}
        onCancel={() => setActiveModal(null)}
        isVisible
        deleteableItemName="profile photo"
      />
    );
  }

  if (activeModal === 'viewer') {
    return (
      <BaseModal
        title="Profile Photo"
        isOpen={true}
        onClose={() => {
          setActiveModal(null);
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
      isModalVisible={isModalVisible && !pendingModal}
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
