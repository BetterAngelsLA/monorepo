import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BodyText from '../BodyText';

interface ICheckboxProps {
  label?: string;
  onCheck: (isChecked: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint: string;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: 16,
  md: 24,
} as const;

export function Checkbox(props: ICheckboxProps) {
  const {
    label,
    onCheck,
    accessibilityHint,
    accessibilityLabel,
    size = 'md',
  } = props;
  const [isChecked, setIsChecked] = useState(false);

  const toggleCheckbox = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onCheck(newState);
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessible
      style={styles.container}
      onPress={toggleCheckbox}
    >
      <View
        style={[
          styles.checkbox,
          isChecked && styles.checked,
          {
            height: SIZES[size],
            width: SIZES[size],
          },
        ]}
      >
        {isChecked && <Text style={styles.checkboxLabel}>✓</Text>}
      </View>
      {label && <BodyText>{label}</BodyText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 3,
    borderColor: Colors.NEUTRAL_LIGHT,
    marginRight: Spacings.sm,
  },
  checked: {
    backgroundColor: Colors.PRIMARY_EXTRA_DARK,
  },
  checkboxLabel: {
    color: Colors.WHITE,
  },
  label: {
    fontSize: 16,
  },
});
