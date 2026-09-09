import { HouseLineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  PressablePanel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatDistanceToNow } from 'date-fns';
import { View } from 'react-native';
import { enumDisplayLivingSituation } from '../../static';
import { ClientProfilesQuery } from '../ClientProfileList/__generated__/ClientProfiles.generated';
import { formatScalarDate } from '@monorepo/shared/scalars';

interface IClientSummaryIdentityProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientSummaryIdentity(
  props: IClientSummaryIdentityProps,
) {
  const { client } = props;

  if (!client.livingSituation && !client.unhousedStartDate) {
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
        <HouseLineIcon color={Colors.NEUTRAL_DARK} />
        <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
          LIVING SITUATION
        </TextBold>
      </View>
      <PressablePanel style={{ padding: Spacings.sm }}>
        {client.livingSituation && (
          <View style={{ marginBottom: Spacings.sm }}>
            <TextRegular size="xs">Living Situation</TextRegular>
            <TextBold size="sm">
              {enumDisplayLivingSituation[client.livingSituation]}
            </TextBold>
          </View>
        )}
        {client.unhousedStartDate && (
          <>
            <TextRegular size="xs">
              Approx. Date Homelessness Started
            </TextRegular>
            <TextBold size="sm">
              {formatScalarDate(client.unhousedStartDate, 'MMM yyyy')} (
              {formatDistanceToNow(client.unhousedStartDate, {
                addSuffix: false,
              })}
              )
            </TextBold>
          </>
        )}
      </PressablePanel>
    </View>
  );
}
