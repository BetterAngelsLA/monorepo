import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IBasicRadioProps {
  label: string | number;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  value: string | undefined | null;
}

export function BasicRadio(props: IBasicRadioProps) {
  const {
    label,
    onPress,
    accessibilityHint,
    accessibilityLabel,
    value,
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
  } = props;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessible
      style={[
        styles.container,
        {
          borderColor: Colors.NEUTRAL_LIGHT,
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.radio, value === label && styles.checked]} />
      <TextRegular size="sm" ml="xs">
        {label}
      </TextRegular>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 100,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  checked: {
    borderWidth: 4,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    height: 16,
    width: 16,
  },
  radioLabel: {
    color: Colors.WHITE,
  },
  label: {
    fontSize: 16,
  },
});
