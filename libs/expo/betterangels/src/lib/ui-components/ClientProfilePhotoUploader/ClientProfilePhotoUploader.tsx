import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { WFEdit } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { Avatar, MediaPicker } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useUploadSession } from '../../providers';
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
  const { begin, setUploadManifest, updateUpload, failUpload, completeUpload, endUpload } =
    useUploadSession();

  const handleUpload = async (file: ReactNativeFile) => {
    setIsUploading(true);
    const session = begin([file.name]);

    try {
      await uploadPhoto({
        clientProfileId: clientId,
        file: { ...file, signal: session.signals[0] },
        onManifest: (manifest) => setUploadManifest(session.id, manifest),
        onProgress: (progress) => updateUpload(session.id, progress),
      });

      completeUpload(session.id);
    } catch (err) {
      console.error(`[ClientProfilePhotoUploader]: ${err}`);

      // Cancelled sessions were already removed by the drawer's cancel action.
      if (session.isAborted()) {
        endUpload(session.id);
      } else {
        // Keep the session so the drawer shows the failure + Close.
        failUpload(
          session.id,
          'Sorry, something went wrong. Please try again.',
        );
      }
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
