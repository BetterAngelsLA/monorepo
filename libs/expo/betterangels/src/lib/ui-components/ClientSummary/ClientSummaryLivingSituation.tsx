import { HouseLineIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  formatDateStatic,
  PressablePanel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatDistanceToNow } from 'date-fns';
import { View } from 'react-native';
import { enumDisplayLivingSituation } from '../../static';
import { ClientProfilesQuery } from '../ClientProfileList/__generated__/ClientProfiles.generated';

interface IClientSummaryIdentityProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientSummaryIdentity(
  props: IClientSummaryIdentityProps
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
          <>
            <TextRegular size="xs">Living Situation</TextRegular>
            <TextBold size="sm">
              {enumDisplayLivingSituation[client.livingSituation]}
            </TextBold>
          </>
        )}
        {client.unhousedStartDate && (
          <>
            <TextRegular size="xs">
              Approx. Date Homelessness Started
            </TextRegular>
            <TextBold size="sm">
              {formatDateStatic({
                date: client.unhousedStartDate,
                inputFormat: 'yyyy-MM-dd',
                outputFormat: 'MMM yyyy',
              })}{' '}
              (
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
