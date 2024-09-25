import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IRadioProps {
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

export function Radio(props: IRadioProps) {
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
          backgroundColor:
            value === label ? Colors.PRIMARY_EXTRA_LIGHT : Colors.WHITE,
          borderColor: Colors.NEUTRAL_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingVertical: Spacings.xs,
          justifyContent: 'space-between',
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        },
      ]}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
    >
      <TextRegular ml="xs">{label}</TextRegular>
      <View style={[styles.radio, value === label && styles.checked]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radiuses.xs,
    borderWidth: 1,
  },
  radio: {
    width: Spacings.sm,
    height: Spacings.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radiuses.xxxl,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  checked: {
    borderWidth: Spacings.xxs,
    borderColor: Colors.PRIMARY_EXTRA_DARK,
    height: Spacings.sm,
    width: Spacings.sm,
  },
  radioLabel: {
    color: Colors.WHITE,
  },
  label: {
    fontSize: FontSizes.md.fontSize,
  },
});
