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
  formatDateStatic,
} from '@monorepo/expo/shared/ui-components';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { CardMenuBtn } from './CardMenuBtn';
import { IClientCardProps } from './ClientCard';
import { formatHeight } from './utils/formatHeight';
import { getLahsaHmisId } from './utils/getLahsaHmisId';

export function ClientCardBase(props: IClientCardProps) {
  const { client, onMenuPress } = props;

  const handleMenuPress = useCallback(() => {
    if (client) {
      onMenuPress?.(client);
    }
  }, [onMenuPress, client]);

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
                {formatDateStatic({
                  date: client.dateOfBirth,
                  inputFormat: 'yyyy-MM-dd',
                  outputFormat: 'MM/dd/yyyy',
                })}{' '}
                ({client.age})
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

      {!!onMenuPress && <CardMenuBtn onPress={handleMenuPress} />}
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
