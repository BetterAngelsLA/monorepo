import {
  IdCardOutlineIcon,
  LocationDotIcon,
  UserOutlineIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  TextBold,
  TextRegular,
  formatDateStatic,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { HmisClientProfileType, HmisSuffixEnum } from '../../apollo';
import { enumDisplayHmisSuffix } from '../../static';
import { formatHeight } from '../ClientCard/utils/formatHeight';

export interface IClientCardProps {
  client: HmisClientProfileType;
  onPress?: () => void;
}

export function ClientCardHMIS(props: IClientCardProps) {
  const {
    client: {
      firstName,
      lastName,
      birthDate,
      alias,
      nameSuffix,
      heightInInches,
      residenceAddress,
      age,
      uniqueIdentifier,
    },
    onPress,
  } = props;
  const formattedHeight = formatHeight(heightInInches ?? 0);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.container,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={{ gap: Spacings.xxs, flex: 2 }}>
        <TextBold size="sm">
          {firstName} {lastName}{' '}
          {nameSuffix &&
            `${enumDisplayHmisSuffix[nameSuffix as HmisSuffixEnum]}`}{' '}
          {alias && `(${alias})`}
        </TextBold>

        {(birthDate || formattedHeight) && (
          <View style={styles.row}>
            <UserOutlineIcon mr="xxs" size="sm" color={Colors.NEUTRAL_DARK} />
            {!!birthDate && (
              <TextRegular size="xs">
                {formatDateStatic({
                  date: birthDate,
                  inputFormat: 'yyyy-MM-dd',
                  outputFormat: 'MM/dd/yyyy',
                })}{' '}
                ({age})
              </TextRegular>
            )}
            {!!birthDate && !!formattedHeight && (
              <TextRegular size="xs"> | </TextRegular>
            )}
            {!!formattedHeight && (
              <TextRegular size="xs">Height: {formattedHeight}</TextRegular>
            )}
          </View>
        )}

        {!!residenceAddress && (
          <View style={styles.row}>
            <LocationDotIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">{residenceAddress}</TextRegular>
          </View>
        )}

        {!!uniqueIdentifier && (
          <View style={styles.row}>
            <IdCardOutlineIcon size="sm" mr="xxs" color={Colors.NEUTRAL_DARK} />
            <TextRegular size="xs">HMIS ID: {uniqueIdentifier}</TextRegular>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radiuses.xs,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    backgroundColor: Colors.WHITE,
    gap: Spacings.xxs,
  },
  pressed: {
    backgroundColor: Colors.GRAY_PRESSED,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
});
