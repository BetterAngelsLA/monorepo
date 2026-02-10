import { useClientPhotoContentUri } from '@monorepo/expo/shared/clients';
import {
  GlobeIcon,
  IdCardOutlineIcon,
  UserIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { HmisClientProfileType, HmisSuffixEnum } from '../../../apollo';
import {
  enumDisplayLanguage,
  enumDisplayPronoun,
  getExistingHmisSuffix,
} from '../../../static';
import { HMISProfilePhotoUploader } from './HMISProfilePhotoUploader';

interface IClientHeaderProps {
  client?: HmisClientProfileType;
}

export function HMISClientProfileHeader(props: IClientHeaderProps) {
  const { client } = props;

  const {
    firstName,
    lastName,
    hmisId: clientId,
    nameMiddle,
    alias,
    nameSuffix,
    preferredLanguage,
    pronouns,
    uniqueIdentifier,
  } = client || {};
  const { thumbnailUri, headers } = useClientPhotoContentUri(clientId);

  const nameParts = [firstName, nameMiddle, lastName].filter((s) => !!s);

  const visibleSuffix = getExistingHmisSuffix(nameSuffix as HmisSuffixEnum);

  if (visibleSuffix) {
    nameParts.push(visibleSuffix);
  }

  if (alias) {
    nameParts.push(`(${alias})`);
  }

  if (!nameParts.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {clientId ? (
          <HMISProfilePhotoUploader
            clientId={clientId}
            imageUrl={thumbnailUri}
            headers={headers}
          />
        ) : (
          <Avatar
            size="xl"
            mr="xs"
            imageUrl={thumbnailUri}
            headers={headers}
            accessibilityLabel="client's profile photo"
            accessibilityHint="profile photo, editing not available"
          />
        )}
        <TextMedium selectable style={{ flexShrink: 1 }} size="lg">
          {nameParts.join(' ')}
        </TextMedium>
      </View>

      <View style={[styles.iconWithTextRow, { marginBottom: Spacings.xs }]}>
        {preferredLanguage && (
          <View style={styles.iconWithTextContainer}>
            <GlobeIcon width={13} color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular size="sm">
              {enumDisplayLanguage[preferredLanguage]}
            </TextRegular>
          </View>
        )}

        {pronouns && (
          <View style={styles.iconWithTextContainer}>
            <UserIcon color={Colors.PRIMARY_EXTRA_DARK} />
            <TextRegular size="sm">{enumDisplayPronoun[pronouns]}</TextRegular>
          </View>
        )}
      </View>

      {!!uniqueIdentifier && (
        <View style={styles.iconWithTextContainer}>
          <IdCardOutlineIcon width={20} color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular selectable size="sm">
            HMIS ID: {uniqueIdentifier}
          </TextRegular>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacings.sm,
    backgroundColor: Colors.WHITE,
    paddingVertical: Spacings.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.sm,
    gap: Spacings.xs,
  },
  iconWithTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  iconWithTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
  },
});
