import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { Input } from '../Input';
import { TPickerItem } from './types';

type TProps = {
  placeholder: string;
  placeholderTextColor?: string;
  items: TPickerItem[];
  /** Opens the picker. A press, never a focus — see `Input`'s `onPress`. */
  onOpen: () => void;
  selectedValue?: string | null;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testId?: string;
};

export const PickerField = React.memo(function PickerField(props: TProps) {
  const {
    onOpen,
    error,
    selectedValue,
    placeholder,
    placeholderTextColor,
    items,
    label,
    required,
    disabled,
    style,
    testId,
  } = props;

  const displayValue = useMemo(() => {
    if (selectedValue == null || selectedValue === '') return undefined;
    const strVal = String(selectedValue);
    const item = items.find((it) => String(it.value) === strVal);
    return item ? (item.displayValue ?? String(item.value)) : undefined;
  }, [items, selectedValue]);

  return (
    <Input
      asSelect
      onPress={onOpen}
      style={style}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      value={displayValue ?? ''}
      label={label}
      error={!!error}
      errorMessage={error}
      testID={testId}
      slotRight={{
        onPress: onOpen,
        component: <ChevronLeftIcon size="sm" rotate="-90deg" />,
        accessibilityLabel: `selector for ${label || 'field'}`,
        accessibilityHint: `opens selector for ${label || 'field'}`,
      }}
    />
  );
});
