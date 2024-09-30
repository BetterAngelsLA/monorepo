import {
  GlobeIcon,
  LocationDotIcon,
  PersonIcon,
  UserIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { enumDisplayLanguage } from '../../static/enumDisplayMapping';
import { ClientProfileQuery } from './__generated__/Client.generated';

interface IClientHeaderProps {
  client: ClientProfileQuery['clientProfile'] | undefined;
  onCaseManagerPress: () => void;
}

export default function ClientHeader(props: IClientHeaderProps) {
  const { client, onCaseManagerPress } = props;

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
        <Avatar
          mr="xs"
          size="lg"
          imageUrl={client?.profilePhoto?.url}
          accessibilityLabel={`${client?.user.firstName} ${client?.user.lastName} avatar`}
          accessibilityHint={'clients avatar'}
        />
        <TextMedium size="lg">
          {client?.user.firstName} {client?.user.lastName}{' '}
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xxs,
        }}
      >
        <PersonIcon color={Colors.PRIMARY_EXTRA_DARK} />
        <TextRegular>
          Current Case Manager:{' '}
          <TextRegular
            onPress={() => {
              if (client?.displayCaseManager !== 'Not Assigned') {
                return onCaseManagerPress();
              }
              return null;
            }}
            textDecorationLine="underline"
          >
            {client?.displayCaseManager}
          </TextRegular>
        </TextRegular>
      </View>
      {/* // TODO: last interaction was split out to DEV-761*/}
      {/* <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xxs,
        }}
      >
        <TentIcon color={Colors.PRIMARY_EXTRA_DARK} />
        <TextRegular>Last Interaction: N/A</TextRegular>
      </View> */}
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
