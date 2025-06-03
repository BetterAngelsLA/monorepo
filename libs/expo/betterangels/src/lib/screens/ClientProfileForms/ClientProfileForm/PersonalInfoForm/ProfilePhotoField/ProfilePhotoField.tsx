import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  EditButton,
  Form,
  MediaPickerModal,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { UpdateClientProfileInput } from '../../../../../apollo';
import { useSnackbar } from '../../../../../hooks';
import { ClientProfileDocument } from '../../../../Client/__generated__/Client.generated';
import { useUpdateClientProfilePhotoMutation } from './__generated__/updateClientProfilePhoto.generated';

type TProps = {
  clientId: string;
  title?: string;
};

export function ProfilePhotoField(props: TProps) {
  const { clientId, title = 'Profile Photo' } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);

  const { showSnackbar } = useSnackbar();
  const { watch } = useFormContext<UpdateClientProfileInput>();

  const [updatePhoto, { loading }] = useUpdateClientProfilePhotoMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: clientId,
        },
      },
    ],
  });

  const profilePhoto = watch('profilePhoto');

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
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: 'Sorry, there was an error uploading profile photo.',
        type: 'error',
      });
    }
  };

  return (
    <View>
      <View style={styles.header}>
        <Form.FieldTitle title={title} />
        <EditButton
          onClick={() => setIsModalVisible(true)}
          accessibilityHint={'update profile photo'}
        />
      </View>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        accessible
        accessibilityRole="button"
        accessibilityHint={'update profile photo'}
      >
        <Avatar
          loading={loading}
          size="xl"
          imageUrl={profilePhoto?.url}
          accessibilityLabel={`client's profile photo`}
          accessibilityHint={`client's profile photo`}
        />
      </Pressable>
      <MediaPickerModal
        onCapture={(file) => onUpload(file)}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => onUpload(files[0])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.xs,
  },
});
