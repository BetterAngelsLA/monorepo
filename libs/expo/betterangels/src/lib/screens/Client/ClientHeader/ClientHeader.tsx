import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import {
  GlobeIcon,
  LocationDotIcon,
  UserIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  EditButton,
  MediaPickerModal,
  TextMedium,
  TextRegular
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSnackbar } from '../../../hooks';
import { enumDisplayLanguage } from '../../../static/enumDisplayMapping';
import { useUpdateClientProfilePhotoMutation } from '../../ClientProfileForms/ClientProfileForm/PersonalInfoForm/ProfilePhotoField/__generated__/updateClientProfilePhoto.generated';
import { ClientProfileDocument, ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientCaseManager } from './ClientCaseManager';



interface IClientHeaderProps {
  client: ClientProfileQuery['clientProfile'] | undefined;
}

export function ClientHeader(props: IClientHeaderProps) {
  const { client } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { showSnackbar } = useSnackbar();

  const [updatePhoto, { loading }] = useUpdateClientProfilePhotoMutation({
    refetchQueries: [
      {
        query: ClientProfileDocument,
        variables: {
          id: client?.id,
        },
      },
    ],
  });

  const onUpload = async (file: ReactNativeFile) => {
    if (!client) return;

    try {
      await updatePhoto({
        variables: {
          data: {
            clientProfile: client.id,
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
    <View
      style={{
        paddingHorizontal: Spacings.sm,
        backgroundColor: Colors.WHITE,
        paddingVertical: Spacings.md,
        gap: Spacings.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacings.xxs,
        }}
      >
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessible
          accessibilityRole="button"
          accessibilityHint={'update profile photo'}
        >
          <Avatar
            loading={loading}
            mr="xs"
            size="xl"
            imageUrl={client?.profilePhoto?.url}
            accessibilityLabel={`client's profile photo`}
            accessibilityHint={`client's profile photo`}
          />
        </Pressable>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: Spacings.xs,
          }}
        >
          <EditButton
            onClick={() => setIsModalVisible(true)}
            accessibilityHint={'update profile photo'}
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
        <TextMedium size="lg">
          {client?.firstName} {client?.lastName}{' '}
          {client?.nickname && `(${client.nickname})`}
        </TextMedium>
      </View>

      <MediaPickerModal
        onCapture={(file) => onUpload(file)}
        allowMultiple={false}
        setModalVisible={setIsModalVisible}
        isModalVisible={isModalVisible}
        setFiles={(files) => onUpload(files[0])}
      />
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacings.xs }}
      >
        {client?.preferredLanguage && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacings.xxs,
            }}
          >
            <GlobeIcon color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular>
              {enumDisplayLanguage[client.preferredLanguage]}
            </TextRegular>
          </View>
        )}
        {client?.pronouns && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacings.xxs,
            }}
          >
            <UserIcon color={Colors.PRIMARY_EXTRA_DARK} />

            <TextRegular>{client.displayPronouns}</TextRegular>
          </View>
        )}
      </View>
      <ClientCaseManager client={client} />
      {client?.residenceAddress && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacings.xxs,
          }}
        >
          <LocationDotIcon color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular>{client.residenceAddress}</TextRegular>
        </View>
      )}
    </View>
  );
}
