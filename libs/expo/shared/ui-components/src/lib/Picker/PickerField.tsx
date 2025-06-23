import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useCallback } from 'react';
import { View, ViewStyle } from 'react-native';
import { Input } from '../Input';
import { TPickerItem } from './types';

type TProps = {
  placeholder: string;
  items: TPickerItem[];
  onFocus: () => void;
  selectedValue?: string | null;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PickerField(props: TProps) {
  const {
    onFocus,
    error,
    selectedValue,
    placeholder,
    items,
    label,
    required,
    disabled,
    style,
  } = props;
  const getDisplayValue = useCallback(
    (value?: string | null) => {
      const item = items.find((item) => item.value === value);

      return item?.displayValue ?? item?.value;
    },
    [items]
  );

  return (
    <>
      <View
        style={[
          {
            borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
          },
          style,
        ]}
      >
        <Input
          asSelect
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={getDisplayValue(selectedValue)}
          label={label}
          error={!!error}
          errorMessage={error}
          onFocus={onFocus}
          slotRight={{
            focusableInput: true,
            component: <ChevronLeftIcon size="sm" rotate={'-90deg'} />,
            accessibilityLabel: `selector for ${label || 'field'}`,
            accessibilityHint: `opens selector for ${label || 'field'}`,
          }}
        />
      </View>
    </>
  );
}
