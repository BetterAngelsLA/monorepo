import {
  GlobeIcon,
  LocationDotIcon,
  UserIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { enumDisplayLanguage } from '../../../static/enumDisplayMapping';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import { ClientCaseManager } from './ClientCaseManager';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';

interface IClientHeaderProps {
  client: ClientProfileQuery['clientProfile'] | undefined;
}

export function ClientHeader(props: IClientHeaderProps) {
  const { client } = props;

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
        <ProfilePhotoUploader
          clientId={client?.id ?? ''}
          imageUrl={client?.profilePhoto?.url}
        />
        <TextMedium selectable size="lg">
          {client?.firstName} {client?.lastName}{' '}
          {client?.nickname && `(${client.nickname})`}
        </TextMedium>
      </View>

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
          <TextRegular selectable>{client.residenceAddress}</TextRegular>
        </View>
      )}
    </View>
  );
}
