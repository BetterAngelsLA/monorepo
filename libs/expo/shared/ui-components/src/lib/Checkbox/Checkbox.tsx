import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  DimensionValue,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ICheckboxProps extends TMarginProps {
  label?: ReactNode;
  onCheck: () => void;
  accessibilityLabel?: string;
  accessibilityHint: string;
  size?: 'sm' | 'md';
  hasBorder?: boolean;
  labelFirst?: boolean;
  justifyContent?: 'flex-start' | 'space-between';
  isChecked: boolean;
  isConsent?: boolean;
  height?: DimensionValue | undefined;
  testId?: string;
}

const SIZES = {
  sm: Spacings.sm,
  md: Spacings.md,
} as const;

export function Checkbox(props: ICheckboxProps) {
  const {
    label,
    onCheck,
    accessibilityHint,
    accessibilityLabel,
    size = 'md',
    hasBorder,
    labelFirst = true,
    justifyContent = 'space-between',
    isChecked,
    height,
    isConsent,
    testId,
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
          height,
          borderColor: hasBorder ? Colors.NEUTRAL_LIGHT : 'transparent',
          backgroundColor:
            isChecked && !isConsent ? Colors.PRIMARY_EXTRA_LIGHT : Colors.WHITE,
          paddingHorizontal: hasBorder ? Spacings.sm : 0,
          paddingVertical: hasBorder ? Spacings.xs : 0,
          justifyContent,
          ...getMarginStyles(props),
          gap: Spacings.sm,
        },
      ]}
      onPress={onCheck}
    >
      {labelFirst ? (
        <>
          {label}
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
              <Text style={styles.checkboxLabel} testID={`checkbox-${testId}`}>
                ✓
              </Text>
            )}
          </View>
        </>
      ) : (
        <>
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
              <Text style={styles.checkboxLabel} testID={`checkbox-${testId}`}>
                ✓
              </Text>
            )}
          </View>
          {label}
        </>
      )}
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
  label: {
    fontSize: FontSizes.md.fontSize,
  },
});
