import { useApolloClient } from '@apollo/client/react';
import {
  incrementClientPhotoVersion,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import { WFEdit } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { Avatar, MediaPicker } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { useClientHmis } from '../../../hooks/useClientHmis';
import { ClientProfileHmisDocument } from '../__generated__/getClientHmis.generated';
import { ProfilePhotoModalHmis } from './ProfilePhotoModalHmis';

interface ProfilePhotoUploaderHmisProps {
  clientId: string;
  imageUrl: string | null;
  headers?: Record<string, string> | null;
}

type ModalType = 'picker' | 'profile' | null;

function buildFormData(file: ReactNativeFile): FormData {
  const formData = new FormData();
  formData.append('FileForm[uploadedFile]', file as unknown as Blob);
  return formData;
}

export function ProfilePhotoUploaderHmis({
  clientId,
  imageUrl,
  headers,
}: ProfilePhotoUploaderHmisProps) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [uploading, setUploading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { uploadClientPhoto } = useClientHmis();
  const apolloClient = useApolloClient();

  const handleUpload = async (file: ReactNativeFile) => {
    // No upload session: this flow is modal and blocking, with the avatar
    // spinner as its progress and a snackbar as its failure. Registering it
    // in the background-upload store only ever put a phantom row in the
    // global progress bar for work the user was already watching.
    setUploading(true);

    try {
      const formData = buildFormData(file);
      await uploadClientPhoto(clientId, formData);
      await apolloClient.refetchQueries({
        include: [ClientProfileHmisDocument],
      });
      incrementClientPhotoVersion(clientId);
      setModalType(null);
    } catch {
      showSnackbar({
        message: 'Error uploading profile photo.',
        type: 'error',
      });
      setModalType(null);
    } finally {
      setUploading(false);
      setModalType(null);
    }
  };

  const handleAvatarPress = () => {
    setModalType('profile');
  };

  const handleAddOrChangePhoto = () => {
    setModalType('picker');
  };

  const isPickerOpen = modalType === 'picker';
  const isProfileOpen = modalType === 'profile';

  return (
    <>
      <Pressable
        onPress={handleAvatarPress}
        accessibilityRole="button"
        accessibilityHint={
          imageUrl ? 'view profile photo options' : 'update profile photo'
        }
      >
        <View style={{ position: 'relative' }}>
          <Avatar
            loading={uploading}
            size="xl"
            mr="xs"
            imageUrl={imageUrl}
            headers={headers}
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

      <ProfilePhotoModalHmis
        isModalVisible={isProfileOpen}
        closeModal={() => setModalType(null)}
        imageUrl={imageUrl ?? ''}
        headers={headers}
        onAddOrChangePhoto={handleAddOrChangePhoto}
      />
    </>
  );
}
