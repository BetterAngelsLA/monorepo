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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [updatePhoto, { loading }] = useUpdateClientProfilePhotoMutation({
    refetchQueries: [
      { query: ClientProfileDocument, variables: { id: clientId } },
    ],
  });

  const onUpload = async (file: ReactNativeFile) => {
    try {
      await updatePhoto({ variables: { data: { clientProfile: clientId, photo: file } } });
      setIsModalVisible(false);
    } catch {
      showSnackbar({ message: 'Error uploading profile photo.', type: 'error' });
    }
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <View style={{ position: 'relative' }}>
        <Pressable onPress={handleOpenModal} accessibilityRole="button" accessibilityHint="update profile photo">
          <Avatar
            loading={loading}
            size="xl"
            mr="xs"
            imageUrl={imageUrl}
            accessibilityLabel="client's profile photo"
            accessibilityHint="client's profile photo"
          />
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: Spacings.xs,
            backgroundColor: 'white'
          }}>
            <WFEdit />
          </View>
        </Pressable>
      </View>
      <MediaPickerModal
        isModalVisible={isModalVisible}
        setModalVisible={handleCloseModal}
        allowMultiple={false}
        onCapture={onUpload}
        setFiles={(files) => onUpload(files[0])}
      />
    </>
  );
}
