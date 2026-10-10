import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import React, { useMemo, type RefObject } from 'react';
import { TextInput, ViewStyle } from 'react-native';
import { Input } from '../Input';
import { TPickerItem } from './types';

type TProps = {
  placeholder: string;
  placeholderTextColor?: string;
  items: TPickerItem[];
  onFocus: () => void;
  /** Passed to the field so `Picker` can drop focus after closing on web. */
  inputRef?: RefObject<TextInput | null>;
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
    onFocus,
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
    inputRef,
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
      inputRef={inputRef}
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
      onFocus={onFocus}
      slotRight={{
        focusableInput: true,
        component: <ChevronLeftIcon size="sm" rotate="-90deg" />,
        accessibilityLabel: `selector for ${label || 'field'}`,
        accessibilityHint: `opens selector for ${label || 'field'}`,
      }}
    />
  );
});
