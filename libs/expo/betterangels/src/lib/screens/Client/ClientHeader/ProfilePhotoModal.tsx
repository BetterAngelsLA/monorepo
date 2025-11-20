import { useMutation } from '@apollo/client/react';
import { DeleteIcon, ViewIcon } from '@monorepo/expo/shared/icons';
import {
  BaseModal,
  DeleteModal,
  ImageViewer,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import {
  MainModal,
  MainModalActionBtn,
} from '../../../ui-components/MainModal';
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
  imageUrl,
  clientId,
}: IProfilePhotoModalProps) {
  const { showSnackbar } = useSnackbar();

  // Local state for fullscreen viewer
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // When parent closes the whole flow, also close the viewer
  useEffect(() => {
    if (!isModalVisible) {
      setIsViewerOpen(false);
    }
  }, [isModalVisible]);

  const [updateClientProfilePhoto] = useMutation(
    UpdateClientProfilePhotoDocument,
    {
      refetchQueries: [
        { query: ClientProfileDocument, variables: { id: clientId } },
      ],
    }
  );

  const deleteFile = async () => {
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
    } finally {
      // Close viewer (if open) and whole profile-photo flow after delete
      setIsViewerOpen(false);
      closeModal();
    }
  };

  const handleViewImagePress = () => {
    setIsViewerOpen(true);
  };

  // Actions as explicit React nodes
  const viewActionNode = (
    <MainModalActionBtn
      key="view-action"
      title="View image"
      Icon={ViewIcon}
      onPress={handleViewImagePress}
    />
  );

  const deleteActionNode = (
    <DeleteModal
      key="delete-action"
      title="Delete image?"
      body="All data associated with this image will be deleted."
      deleteableItemName="profile photo"
      onDelete={deleteFile}
      onCancel={() => {
        // nothing needed on cancel
      }}
      button={
        <MainModalActionBtn
          title="Delete image"
          Icon={DeleteIcon}
          // Non-empty no-op: satisfies TS + eslint but does nothing.
          onPress={() => undefined}
        />
      }
    />
  );

  const ACTIONS = [viewActionNode, deleteActionNode];

  return (
    <>
      {/* Hide sheet while viewer is open to avoid overlay/z-index issues */}
      {!isViewerOpen && (
        <MainModal
          closeButton
          vertical
          actions={ACTIONS}
          isModalVisible={isModalVisible}
          closeModal={() => {
            setIsViewerOpen(false);
            closeModal();
          }}
          opacity={0.5}
        />
      )}

      {/* Fullscreen viewer using BaseModal (original implementation) */}
      <BaseModal
        title="Profile Photo"
        isOpen={isViewerOpen}
        onClose={() => {
          // Close viewer AND whole flow
          setIsViewerOpen(false);
          closeModal();
        }}
        variant="fullscreen"
      >
        <View style={styles.viewerContainer}>
          {imageUrl ? <ImageViewer url={imageUrl} /> : null}
        </View>
      </BaseModal>
    </>
  );
}

const styles = StyleSheet.create({
  viewerContainer: {
    flex: 1,
  },
});
