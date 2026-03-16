import { UserOutlineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Panel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ClientProfilesQuery } from '../../ClientProfileList/__generated__/ClientProfiles.generated';

interface IClientSummaryIdentityProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientSummaryIdentity(
  props: IClientSummaryIdentityProps
) {
  const { client } = props;

  if (!client.physicalDescription) {
    return null;
  }

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacings.xs,
          marginBottom: Spacings.xs,
        }}
      >
        <UserOutlineIcon color={Colors.NEUTRAL_DARK} />
        <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
          IDENTITY
        </TextBold>
      </View>
      <Panel style={{ padding: Spacings.sm }}>
        <TextRegular size="xs">Physical Description</TextRegular>
        <TextBold size="sm">{client.physicalDescription}</TextBold>
      </Panel>
    </View>
  );
}
