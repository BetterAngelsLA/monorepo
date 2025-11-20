import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  TextBold,
  TextRegular,
  formatDateStatic,
} from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { HmisClientProfileType } from '../../apollo';
import { NameSuffixHMIS } from './NameSuffixHMIS';

export interface IClientCardProps {
  client: HmisClientProfileType;
  onPress?: () => void;
}

export function ClientCardHMIS(props: IClientCardProps) {
  const {
    client: { firstName, lastName, birthDate, alias, nameMiddle, nameSuffix },
    onPress,
  } = props;

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
      <View style={[styles.row, { gap: 2 }]}>
        <TextBold size="sm">{firstName}</TextBold>
        {!!nameMiddle && <TextBold size="sm">{nameMiddle}</TextBold>}
        <TextBold size="sm">{lastName}</TextBold>
        <NameSuffixHMIS suffix={nameSuffix} />
        {!!alias && <TextBold size="sm">({alias})</TextBold>}
      </View>

      {!!birthDate && (
        <View style={styles.row}>
          <TextRegular size="xs">
            {formatDateStatic({
              date: birthDate,
              inputFormat: 'yyyy-MM-dd',
              outputFormat: 'MM/dd/yyyy',
            })}
          </TextRegular>
        </View>
      )}
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
