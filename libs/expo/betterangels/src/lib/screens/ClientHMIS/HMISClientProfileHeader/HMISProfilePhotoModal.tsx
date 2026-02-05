import { WFEdit, ViewIcon } from '@monorepo/expo/shared/icons';
import {
  BaseModal,
  ImageViewer,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MainModal,
  MainModalActionBtn,
} from '../../../ui-components/MainModal';

interface HMISProfilePhotoModalProps {
  closeModal: () => void;
  isModalVisible: boolean;
  imageUrl: string;
  headers?: Record<string, string> | null;
  onAddOrChangePhoto?: () => void;
}

export function HMISProfilePhotoModal({
  isModalVisible,
  closeModal,
  imageUrl,
  headers,
  onAddOrChangePhoto,
}: HMISProfilePhotoModalProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    if (!isModalVisible) {
      setIsViewerOpen(false);
    }
  }, [isModalVisible]);

  const handleViewImagePress = () => {
    setIsViewerOpen(true);
  };

  const handleAddOrChangePhoto = () => {
    closeModal();
    onAddOrChangePhoto?.();
  };

  const viewActionNode = (
    <MainModalActionBtn
      key="view-action"
      title="View image"
      Icon={ViewIcon}
      onPress={handleViewImagePress}
    />
  );

  const addOrChangeActionNode = onAddOrChangePhoto ? (
    <MainModalActionBtn
      key="add-change-action"
      title="Add / Change photo"
      Icon={WFEdit}
      onPress={handleAddOrChangePhoto}
    />
  ) : null;

  const ACTIONS = [viewActionNode, addOrChangeActionNode].filter(Boolean);

  return (
    <>
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

      <BaseModal
        title="Profile Photo"
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          closeModal();
        }}
        variant="fullscreen"
      >
        <View style={styles.viewerContainer}>
          {imageUrl ? (
            <ImageViewer url={imageUrl} headers={headers ?? undefined} />
          ) : null}
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
