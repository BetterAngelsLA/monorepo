import { PersonIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { HrefObject, Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { RelationshipTypeEnum } from '../../../apollo';
import { ClientProfileSectionEnum } from '../../../screenRouting';
import { getEditButtonRoute } from '../ClientProfile/utils/getEditButtonRoute';
import { ClientProfileQuery } from '../__generated__/Client.generated';

type TProps = {
  client: ClientProfileQuery['clientProfile'] | undefined;
};

export function ClientCaseManager(props: TProps) {
  const { client } = props;

  const caseManagers =
    client?.contacts?.filter(
      (contact) =>
        contact.relationshipToClient === RelationshipTypeEnum.CurrentCaseManager
    ) || [];

  const primaryCCM = caseManagers[0];

  let ccmHref: HrefObject | undefined = undefined;

  if (client && primaryCCM) {
    ccmHref = getEditButtonRoute({
      clientProfile: client,
      section: ClientProfileSectionEnum.RelevantContacts,
    });
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacings.xxs,
      }}
    >
      <PersonIcon color={Colors.PRIMARY_EXTRA_DARK} />
      <View>
        <TextRegular>Current Case Manager:</TextRegular>
      </View>

      {!!ccmHref && (
        <Link href={ccmHref} style={styles.ccmLink}>
          <TextRegular selectable>{primaryCCM.name}</TextRegular>
        </Link>
      )}

      {!ccmHref && <TextRegular>Not Assigned</TextRegular>}
    </View>
  );
}

const styles = StyleSheet.create({
  ccmLink: {
    textDecorationLine: 'underline',
  },
});
