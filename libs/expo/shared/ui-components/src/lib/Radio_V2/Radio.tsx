import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import TextRegular from '../TextRegular';

interface IRadioProps {
  displayValue?: string;
  onPress: (value: string) => void;
  value: string;
  selectedValue?: string;
}

export function Radio(props: IRadioProps) {
  const { displayValue, onPress, value, selectedValue } = props;

  return (
    <Pressable
      accessibilityHint={`selects ${value}`}
      accessibilityRole="button"
      accessible
      style={[
        styles.container,
        {
          backgroundColor:
            value === selectedValue ? Colors.PRIMARY_EXTRA_LIGHT : Colors.WHITE,
          borderColor: Colors.NEUTRAL_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingVertical: Spacings.xs,
          justifyContent: 'space-between',
        },
      ]}
      onPress={() => {
        Keyboard.dismiss();
        onPress(value);
      }}
    >
      <TextRegular ml="xs">{displayValue || value}</TextRegular>
      <View style={[styles.radio, value === selectedValue && styles.checked]} />
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
    backgroundColor: Colors.WHITE,
  },
  radioLabel: {
    color: Colors.WHITE,
  },
  label: {
    fontSize: FontSizes.md.fontSize,
  },
});
