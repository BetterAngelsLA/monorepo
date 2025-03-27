import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { DimensionValue, Pressable, StyleSheet } from 'react-native';
import { CheckboxCheck } from './CheckboxCheck';

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

export function Checkbox(props: ICheckboxProps) {
  const {
    label,
    onCheck,
    accessibilityHint,
    accessibilityLabel,
    size,
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
      {!!labelFirst && label}
      <CheckboxCheck isChecked={isChecked} size={size} testId={testId} />
      {!labelFirst && label}
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
  label: {
    fontSize: FontSizes.md.fontSize,
  },
});
