import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { UserOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import {
  CardWrapper,
  MediaPickerModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { UpdateClientProfileInput } from '../../../apollo';
import { ClientProfileDocument } from '../../Client/__generated__/Client.generated';
import { useUpdateClientProfilePhotoMutation } from '../__generated__/AddEditClient.generated';

export default function ProfilePhoto({ clientId }: { clientId: string }) {
  const { watch } = useFormContext<UpdateClientProfileInput>();

  const photo = watch('profilePhoto');
  console.log(photo);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [updatePhoto] = useUpdateClientProfilePhotoMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: clientId,
        },
      },
    ],
  });

  const onUpload = async (file: ReactNativeFile) => {
    try {
      await updatePhoto({
        variables: {
          data: {
            clientProfile: clientId,
            photo: file,
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <CardWrapper
      action={
        <TextButton
          fontSize="sm"
          title="Add"
          accessibilityHint={'adds profile photo'}
          onPress={() => setIsModalVisible(true)}
        />
      }
      title="Profile Photo"
    >
      <View style={styles.profilePhoto}>
        <UserOutlineIcon size="xl" />
      </View>
      <MediaPickerModal
        onCapture={(file) => onUpload(file)}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => onUpload(files[0])}
      />
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  profilePhoto: {
    height: 60,
    width: 60,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderRadius: Radiuses.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
