import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Avatar, EditButton, MediaPickerModal } from '@monorepo/expo/shared/ui-components';
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
  const [modalKey, setModalKey] = useState(0);
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
    setModalKey(prev => prev + 1);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <View style={{ position: 'relative' }}>
        <Pressable onPress={handleOpenModal}>
          <Avatar
            loading={loading}
            size="xl"
            mr="xs"
            imageUrl={imageUrl}
            accessibilityLabel="client's profile photo"
            accessibilityHint="client's profile photo"
          />
        </Pressable>
        <View style={{ position: 'absolute', bottom: 0, right: Spacings.xs }}>
          <EditButton
            onClick={handleOpenModal}
            iconSize="sm"
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 12,
              width: 24,
              height: 24,
            }}
          />
        </View>
      </View>
      <MediaPickerModal
        key={`modal-${modalKey}`}
        isModalVisible={isModalVisible}
        setModalVisible={handleCloseModal}
        allowMultiple={false}
        onCapture={onUpload}
        setFiles={(files) => onUpload(files[0])}
      />
    </>
  );
}
