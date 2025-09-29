import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useCallback } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { Input } from '../Input';
import { TPickerItem } from './types';

type TProps = {
  placeholder: string;
  items: TPickerItem[];
  onPress: () => void; // press to open
  selectedValue?: string | null;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PickerField(props: TProps) {
  const {
    onPress,
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
      const item = items.find((i) => i.value === value);
      return item?.displayValue ?? item?.value;
    },
    [items]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || 'picker'}
      accessibilityHint={`opens selector for ${label || 'field'}`}
      onPress={() => {
        if (disabled) return;
        onPress();
      }}
      hitSlop={8}
      style={[
        {
          borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        },
        style,
      ]}
    >
      <View>
        <Input
          asSelect
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={getDisplayValue(selectedValue)}
          label={label}
          error={!!error}
          errorMessage={error}
          editable={false} // prevent focus/keyboard loop
          slotRight={{
            focusableInput: false, // chevron won’t steal focus
            component: <ChevronLeftIcon size="sm" rotate="-90deg" />,
            accessibilityLabel: `selector for ${label || 'field'}`,
            accessibilityHint: `opens selector for ${label || 'field'}`,
          }}
        />
      </View>
    </Pressable>
  );
}
