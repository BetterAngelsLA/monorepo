import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { WFEdit } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { Avatar, MediaPicker } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
// Imported by path, not through the hooks barrel: that barrel reaches into
// screens, which import this component back through the ui-components index.
import useSnackbar from '../../hooks/snackbar/useSnackbar';
import { ProfilePhotoModal } from '../../screens/Client/ClientHeader/ProfilePhotoModal';
import { useClientProfilePhotoUpload } from './useClientProfilePhotoUpload';

type TProps = {
  clientId: string;
  imageUrl?: string;
};

type ModalType = 'picker' | 'profile' | null;

export function ClientProfilePhotoUploader(props: TProps) {
  const { clientId, imageUrl } = props;

  const [modalType, setModalType] = useState<ModalType>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadPhoto } = useClientProfilePhotoUpload();
  const { showSnackbar } = useSnackbar();

  const handleUpload = async (file: ReactNativeFile) => {
    // No upload session: this flow is modal and blocking, with the avatar
    // spinner as its progress and a snackbar as its failure. The background
    // session store is for work the user has navigated away from.
    setIsUploading(true);

    try {
      await uploadPhoto({ clientProfileId: clientId, file });
    } catch (err) {
      console.error(`[ClientProfilePhotoUploader]: ${err}`);

      showSnackbar({
        message: 'Sorry, something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      setModalType(null);
    }
  };

  const isPickerOpen = modalType === 'picker';
  const isProfileOpen = modalType === 'profile';

  return (
    <>
      <Pressable
        onPress={() => setModalType(imageUrl ? 'profile' : 'picker')}
        accessibilityRole="button"
        accessibilityHint={
          imageUrl ? 'view profile photo options' : 'update profile photo'
        }
      >
        <View style={{ position: 'relative' }}>
          <Avatar
            loading={isUploading}
            size="xl"
            mr="xs"
            imageUrl={imageUrl}
            accessibilityLabel="client's profile photo"
            accessibilityHint={
              imageUrl ? 'view profile photo options' : 'update profile photo'
            }
          />
          {!imageUrl && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: Spacings.xs,
                backgroundColor: 'white',
              }}
            >
              <WFEdit />
            </View>
          )}
        </View>
      </Pressable>

      <MediaPicker
        allowMultiple={false}
        isOpen={isPickerOpen}
        onClose={() => setModalType(null)}
        onCameraCapture={handleUpload}
        onFilesSelected={(files) => handleUpload(files[0])}
      />

      {imageUrl && (
        <ProfilePhotoModal
          isModalVisible={isProfileOpen}
          closeModal={() => setModalType(null)}
          imageUrl={imageUrl}
          clientId={clientId}
        />
      )}
    </>
  );
}
