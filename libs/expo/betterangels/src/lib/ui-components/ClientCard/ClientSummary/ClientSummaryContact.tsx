import {
  CallOutlinedIcon,
  ExternalLinkOutlinedIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Panel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { Linking, View } from 'react-native';
import { RelationshipTypeEnum } from '../../../apollo';
import { ClientProfilesQuery } from '../../ClientProfileList/__generated__/ClientProfiles.generated';

interface IClientSummaryContactProps {
  client: ClientProfilesQuery['clientProfiles']['results'][number];
}

export default function ClientSummaryContact(
  props: IClientSummaryContactProps
) {
  const { client } = props;

  const caseManagers =
    client?.contacts?.filter(
      (contact) =>
        contact.relationshipToClient === RelationshipTypeEnum.CurrentCaseManager
    ) || [];

  const primaryCCM = caseManagers[0];

  const formattedNumber =
    primaryCCM?.phoneNumber && formatPhoneNumber(primaryCCM?.phoneNumber);

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
        <CallOutlinedIcon color={Colors.NEUTRAL_DARK} />
        <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
          CONTACT INFO
        </TextBold>
      </View>
      <Panel
        onPress={() =>
          primaryCCM?.phoneNumber &&
          Linking.openURL(`tel:${primaryCCM.phoneNumber}`)
        }
        style={{ padding: Spacings.sm }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: Spacings.sm,
          }}
        >
          <View
            style={{
              gap: Spacings.xxs,
            }}
          >
            <TextRegular size="xs">
              Case Manager: {primaryCCM?.name || 'N/A'}
            </TextRegular>
            {formattedNumber && (
              <TextBold textDecorationLine="underline" size="sm">
                {formattedNumber}
              </TextBold>
            )}
          </View>
          {formattedNumber && (
            <ExternalLinkOutlinedIcon color={Colors.PRIMARY} />
          )}
        </View>
      </Panel>
    </View>
  );
}
