import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { StyleSheet, Text, View } from 'react-native';

interface TProps {
  isChecked: boolean;
  size?: 'sm' | 'md';
  testId?: string;
}

const SIZES = {
  sm: Spacings.sm,
  md: Spacings.md,
} as const;

export function CheckboxCheck(props: TProps) {
  const { isChecked, size = 'md', testId } = props;

  return (
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
      {isChecked && (
        <Text style={styles.checkboxLabel} testID={testId}>
          ✓
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: Spacings.md,
    height: Spacings.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radiuses.xxxs,
    borderColor: Colors.NEUTRAL_LIGHT,
  },
  checked: {
    backgroundColor: Colors.PRIMARY_EXTRA_DARK,
  },
  checkboxLabel: {
    color: Colors.WHITE,
    position: 'absolute',
  },
});
