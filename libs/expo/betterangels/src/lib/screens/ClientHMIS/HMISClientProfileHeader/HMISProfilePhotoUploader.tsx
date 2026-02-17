import { useApolloClient } from '@apollo/client/react';
import {
  incrementClientPhotoVersion,
  ReactNativeFile,
} from '@monorepo/expo/shared/clients';
import { WFEdit } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { Avatar, MediaPickerModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { useHmisClient } from '../../../hooks/useHmisClient';
import { HmisClientProfileDocument } from '../__generated__/getHMISClient.generated';
import { HMISProfilePhotoModal } from './HMISProfilePhotoModal';

interface HMISProfilePhotoUploaderProps {
  clientId: string;
  imageUrl: string | null;
  headers?: Record<string, string> | null;
  onUploadSuccess?: () => void;
}

type ModalType = 'picker' | 'profile' | null;

function buildFormData(file: ReactNativeFile): FormData {
  const formData = new FormData();
  formData.append('FileForm[uploadedFile]', file as unknown as Blob);
  return formData;
}

export function HMISProfilePhotoUploader({
  clientId,
  imageUrl,
  headers,
  onUploadSuccess,
}: HMISProfilePhotoUploaderProps) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [uploading, setUploading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { uploadClientPhoto } = useHmisClient();
  const apolloClient = useApolloClient();

  const handleUpload = async (file: ReactNativeFile) => {
    setUploading(true);
    try {
      const formData = buildFormData(file);
      await uploadClientPhoto(clientId, formData);
      await apolloClient.refetchQueries({
        include: [HmisClientProfileDocument],
      });
      incrementClientPhotoVersion(clientId);
      onUploadSuccess?.();
      setModalType(null);
    } catch {
      showSnackbar({
        message: 'Error uploading profile photo.',
        type: 'error',
      });
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

      <MediaPickerModal
        isModalVisible={isPickerOpen}
        setModalVisible={(v) => setModalType(v ? 'picker' : null)}
        allowMultiple={false}
        onCapture={handleUpload}
        setFiles={(files) => handleUpload(files[0])}
      />

      <HMISProfilePhotoModal
        isModalVisible={isProfileOpen}
        closeModal={() => setModalType(null)}
        imageUrl={imageUrl ?? ''}
        headers={headers}
        onAddOrChangePhoto={handleAddOrChangePhoto}
      />
    </>
  );
}
