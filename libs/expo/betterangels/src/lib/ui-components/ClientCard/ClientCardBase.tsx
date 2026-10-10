import {
  IdCardOutlineIcon,
  LocationDotIcon,
  UserOutlineIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Avatar,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { IClientCardProps } from './ClientCard';
import { formatHeight } from './utils/formatHeight';
import { getLahsaHmisId } from './utils/getLahsaHmisId';
import { formatScalarDate } from '@monorepo/shared/scalars';

/**
 * The card's *contents* only — no menu, and no press handling.
 *
 * The menu button deliberately lives in `ClientCard` as a sibling of the card's
 * pressable area rather than inside it. `accessibilityRole="button"` renders a
 * real `<button>` on web, and a button nested inside a button is invalid HTML
 * (React reports it as a hydration error) as well as a screen-reader problem.
 */
export function ClientCardBase(props: IClientCardProps) {
  const { client } = props;

  if (!client) {
    return null;
  }

  const formattedHeight = formatHeight(client.heightInInches ?? 0);
  const lahsaHmisId = getLahsaHmisId(client.hmisProfiles);

  return (
    <>
      <Avatar
        accessibilityLabel={`client's profile photo`}
        accessibilityHint={`client's profile photo`}
        imageUrl={client.profilePhoto?.url}
        size="xl"
        mr="xs"
      />
      <View style={{ gap: Spacings.xxs, flex: 2 }}>
        <TextBold size="sm">
          {client.firstName} {client.lastName}{' '}
          {client.nickname && `(${client.nickname})`}
        </TextBold>

        {(client.dateOfBirth || formattedHeight) && (
          <View style={styles.row}>
            <UserOutlineIcon mr="xxs" size="sm" color={Colors.NEUTRAL_DARK} />
            {!!client.dateOfBirth && (
              <TextRegular size="xs">
                {formatScalarDate(client.dateOfBirth, 'MM/dd/yyyy')} (
                {client.age})
              </TextRegular>
            )}
            {!!client.dateOfBirth && !!client.heightInInches && (
              <TextRegular size="xs"> | </TextRegular>
            )}
            {!!client.heightInInches && (
              <TextRegular size="xs">Height: {formattedHeight}</TextRegular>
            )}
          </View>
        )}

        {!!client.residenceAddress && (
          <View style={styles.row}>
            <LocationDotIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">{client.residenceAddress}</TextRegular>
          </View>
        )}

        {!!lahsaHmisId && (
          <View style={styles.row}>
            <IdCardOutlineIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">LAHSA HMIS ID: {lahsaHmisId}</TextRegular>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
});
