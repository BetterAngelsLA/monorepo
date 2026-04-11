import {
  CallOutlinedIcon,
  EmailIcon,
  ExternalLinkOutlinedIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  PressablePanel,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { Linking, View } from 'react-native';
import { RelationshipTypeEnum } from '../../apollo';
import { ClientProfilesQuery } from '../ClientProfileList/__generated__/ClientProfiles.generated';

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

  const [phoneNumber, extension] = formattedNumber || [];
  const mailingAddress = primaryCCM?.mailingAddress;
  const email = primaryCCM?.email;

  const phoneNumberUrl = extension
    ? `${phoneNumber},${extension}`
    : phoneNumber;

  const showPhone = !!phoneNumber;
  const showEmail = !showPhone && !!email;
  const showAddress = !showPhone && !showEmail && !!mailingAddress;

  const isTappable = showPhone || showEmail;

  const handlePress = () => {
    if (showPhone) {
      Linking.openURL(`tel:${phoneNumberUrl}`);
    } else if (showEmail) {
      Linking.openURL(`mailto:${email}`);
    }
  };

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
        {(showEmail || showAddress) && (
          <EmailIcon color={Colors.NEUTRAL_DARK} />
        )}
        {showPhone && <CallOutlinedIcon color={Colors.NEUTRAL_DARK} />}
        <TextBold size="xs" color={Colors.NEUTRAL_DARK}>
          CONTACT INFO
        </TextBold>
      </View>
      <PressablePanel
        onPress={handlePress}
        disabled={!isTappable}
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
            {showPhone && (
              <>
                <TextBold textDecorationLine="underline" size="sm">
                  {phoneNumber}
                </TextBold>
                {extension && (
                  <TextBold size="sm">
                    {' ext.'}
                    {extension}
                  </TextBold>
                )}
              </>
            )}
            {showEmail && (
              <TextBold textDecorationLine="underline" size="sm">
                {email}
              </TextBold>
            )}
            {showAddress && (
              <TextRegular size="sm">{mailingAddress}</TextRegular>
            )}
          </View>
          {isTappable && <ExternalLinkOutlinedIcon color={Colors.PRIMARY} />}
        </View>
      </PressablePanel>
    </View>
  );
}
