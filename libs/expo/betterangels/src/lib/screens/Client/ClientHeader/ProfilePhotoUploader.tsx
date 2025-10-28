import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { WFEdit } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { Avatar, MediaPickerModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { useUpdateClientProfilePhotoMutation } from '../../ClientProfileForms/ClientProfileForm/PersonalInfoForm/ProfilePhotoField/__generated__/updateClientProfilePhoto.generated';
import { ClientProfileDocument } from '../__generated__/Client.generated';

interface Props {
  clientId: string;
  imageUrl?: string;
}

export function ProfilePhotoUploader({ clientId, imageUrl }: Props) {
  const [isModalVisible, setModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  const [updatePhoto, { loading }] = useUpdateClientProfilePhotoMutation({
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

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
      setModalVisible(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityHint="update profile photo"
      >
        <View style={{ position: 'relative' }}>
          <Avatar
            loading={loading}
            size="xl"
            mr="xs"
            imageUrl={imageUrl}
            accessibilityLabel="client's profile photo"
            accessibilityHint="update profile photo"
          />
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
        </View>
      </Pressable>

      <MediaPickerModal
        isModalVisible={isModalVisible}
        setModalVisible={setModalVisible}
        allowMultiple={false}
        onCapture={handleUpload}
        setFiles={(files) => handleUpload(files[0])}
      />
    </>
  );
}
