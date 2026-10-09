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
import { CheckboxLabel } from './CheckboxLabel';

interface ICheckboxProps extends TMarginProps {
  label?: ReactNode;
  onCheck: () => void;
  accessibilityLabel?: string;
  accessibilityHint: string;
  /**
   * Defaults to `'button'` (the long-standing contract).
   *
   * Pass `'checkbox'` when the label contains its own interactive content, such
   * as a link to the terms of service. `accessibilityRole="button"` renders a
   * real `<button>` on react-native-web, and an `<a>` inside a `<button>` is
   * invalid HTML that React reports as a hydration error — `'checkbox'` renders
   * a `<div role="checkbox">`, which is both valid and the more accurate role.
   */
  accessibilityRole?: 'button' | 'checkbox';
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
    accessibilityRole = 'button',
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
      accessibilityRole={accessibilityRole}
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
      {!!labelFirst && <CheckboxLabel label={label} />}
      <CheckboxCheck isChecked={isChecked} size={size} testId={testId} />
      {!labelFirst && <CheckboxLabel label={label} />}
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
