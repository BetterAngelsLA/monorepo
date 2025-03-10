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
  value?: string;
  selectedItem?: string;
  error?: string;
}

export function Radio(props: IRadioProps) {
  const { displayValue, onPress, value, selectedItem, error } = props;

  return (
    <Pressable
      accessibilityHint={`selects ${displayValue}`}
      accessibilityRole="button"
      accessible
      style={[
        styles.container,
        {
          backgroundColor: error
            ? Colors.ERROR
            : value === selectedItem
            ? Colors.PRIMARY_EXTRA_LIGHT
            : Colors.WHITE,
          borderColor: Colors.NEUTRAL_LIGHT,
          paddingHorizontal: Spacings.sm,
          paddingVertical: Spacings.xs,
          justifyContent: 'space-between',
        },
      ]}
      onPress={() => {
        Keyboard.dismiss();
        if (value) {
          onPress(value);
        }
      }}
    >
      {displayValue && <TextRegular ml="xs">{displayValue}</TextRegular>}
      <View style={[styles.radio, value === selectedItem && styles.checked]} />
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
