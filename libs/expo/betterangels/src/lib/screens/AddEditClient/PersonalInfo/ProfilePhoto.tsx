import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  Avatar,
  CardWrapper,
  MediaPickerModal,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UpdateClientProfileInput } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import { ClientProfileDocument } from '../../Client/__generated__/Client.generated';
import { useUpdateClientProfilePhotoMutation } from '../__generated__/AddEditClient.generated';

export default function ProfilePhoto({ clientId }: { clientId: string }) {
  const { watch } = useFormContext<UpdateClientProfileInput>();
  const { showSnackbar } = useSnackbar();

  const photo = watch('profilePhoto');
  const [isModalVisible, setIsModalVisible] = useState(false);
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
    <CardWrapper
      action={
        <TextButton
          fontSize="sm"
          title={photo?.url ? 'Edit' : 'Add'}
          accessibilityHint={'adds profile photo'}
          onPress={() => setIsModalVisible(true)}
        />
      }
      title="Profile Photo"
    >
      <Avatar
        loading={loading}
        size="xl"
        imageUrl={photo?.url}
        accessibilityLabel={`client profile avatar`}
        accessibilityHint={'client profile avatar'}
      />
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
