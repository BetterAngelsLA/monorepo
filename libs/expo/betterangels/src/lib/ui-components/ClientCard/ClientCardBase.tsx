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
import { StyleSheet, View } from 'react-native';
import { HmisProfileType, Maybe } from '../../apollo';
import { CardMenuBtn } from './CardMenuBtn';
import { IClientCardProps } from './ClientCard';

export function ClientCardBase(props: IClientCardProps) {
  const { client, onMenuPress } = props;

  if (!client) {
    return null;
  }

  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}' ${remainingInches}"`;
  };

  const getLahsaHmisId = (
    hmisProfiles: Maybe<HmisProfileType[] | undefined>
  ) => {
    return hmisProfiles?.find((profile) => profile?.agency === 'LAHSA')?.hmisId;
  };

  const formattedHeight = client.heightInInches
    ? formatHeight(client.heightInInches)
    : null;

  const lahsaHmisId = client.hmisProfiles
    ? getLahsaHmisId(client.hmisProfiles)
    : null;

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
      {!!onMenuPress && <CardMenuBtn onPress={() => onMenuPress(client)} />}
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
