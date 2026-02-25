import { useMutation } from '@apollo/client/react';
import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { WFEdit } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { Avatar, MediaPickerModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { UpdateClientProfilePhotoDocument } from '../../ClientProfileForms/ClientProfileForm/PersonalInfoForm/ProfilePhotoField/__generated__/updateClientProfilePhoto.generated';
import { ClientProfileDocument } from '../__generated__/Client.generated';
import { ProfilePhotoModal } from './ProfilePhotoModal';

interface Props {
  clientId: string;
  imageUrl?: string;
}

type ModalType = 'picker' | 'profile' | null;

export function ProfilePhotoUploader({ clientId, imageUrl }: Props) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const { showSnackbar } = useSnackbar();

  const [updatePhoto, { loading }] = useMutation(
    UpdateClientProfilePhotoDocument,
    {
      refetchQueries: [
        { query: ClientProfileDocument, variables: { id: clientId } },
      ],
    }
  );

  const handleUpload = async (file: ReactNativeFile) => {
    try {
      await updatePhoto({
        variables: { data: { clientProfile: clientId, photo: file } },
      });
    } catch {
      showSnackbar({
        message: 'Error uploading profile photo.',
        type: 'error',
      });
    } finally {
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
            loading={loading}
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

      <MediaPickerModal
        isModalVisible={isPickerOpen}
        setModalVisible={(v) => setModalType(v ? 'picker' : null)}
        allowMultiple={false}
        onCapture={handleUpload}
        setFiles={(files) => handleUpload(files[0])}
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
