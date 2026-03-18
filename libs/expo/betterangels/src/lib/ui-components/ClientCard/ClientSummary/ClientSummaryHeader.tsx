import { Colors } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientProfilesQuery } from '../../ClientProfileList/__generated__/ClientProfiles.generated';

interface IClientSummaryHeaderProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientSummaryHeader(props: IClientSummaryHeaderProps) {
  const { client } = props;

  const nicknamePronouns = [client.nickname, client.displayPronouns]
    .filter(Boolean)
    .join(' - ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Avatar
        mb="sm"
        imageUrl={client.profilePhoto?.url}
        size="2xl"
        accessibilityLabel={`${client.firstName} ${client.lastName} profile photo`}
        accessibilityHint="profile photo"
      />
      <TextBold size="lg">
        {[client.firstName, client.middleName, client.lastName]
          .filter(Boolean)
          .join(' ')}
      </TextBold>
      {nicknamePronouns && (
        <TextRegular size="sm" mb="xs" color={Colors.NEUTRAL_DARK}>
          ({nicknamePronouns})
        </TextRegular>
      )}

      <TextRegular size="sm" mb="xs" color={Colors.NEUTRAL_DARK}>
        HMIS ID: {client.hmisProfiles?.[0]?.id || 'N/A'}
      </TextRegular>
    </View>
  );
}
