import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Pressable, StyleSheet, View } from 'react-native';
import { DatePickerInput } from 'react-native-paper-dates';
import FormFieldLabel from '../FormFieldLabel';
import { InputClearIcon } from '../Input/InputClearIcon';
import { INumericDatePickerProps } from './types';

export function NumericDatePicker(props: INumericDatePickerProps) {
  const { label, disabled, value, onChange, onDelete, showClearButton = true, ...rest } = props;

  const handleClear = () => {
    if (onDelete) {
      onDelete();
    } else {
      onChange?.(null);
    }
  };

  const handleChange = (date: Date | undefined) => {
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      onChange?.(date);
    } else if (date === undefined) {
      handleClear();
    }
  };

  return (
    <View>
      {typeof label === 'string' && <FormFieldLabel label={label} />}
      <View style={styles.inputWrapper}>
        <DatePickerInput
          locale="en"
          inputMode="start"
          mode="outlined"
          iconColor={Colors.PRIMARY_EXTRA_DARK}
          textColor={
            disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK
          }
          placeholderTextColor={Colors.NEUTRAL}
          outlineColor={Colors.NEUTRAL_LIGHT}
          outlineStyle={{
            borderRadius: Radiuses.xs,
            borderWidth: 1,
            borderColor: Colors.NEUTRAL_LIGHT,
          }}
          withDateFormatInLabel={false}
          style={{
            width: '100%',
            height: 56,
          }}
          disabled={disabled}
          {...rest}
          value={value}
          onChange={handleChange}
          calendarIcon={value ? '' : undefined}
        />

        {value && showClearButton && !disabled && (onDelete || onChange) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear date"
            accessibilityHint="Clears the selected date"
            hitSlop={8}
            style={styles.clearButton}
            disabled={disabled}
            onPress={handleClear}
          >
            <InputClearIcon />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
  },
  clearButton: {
    position: 'absolute',
    right: Spacings.sm,
    top: '50%',
    transform: [{ translateY: -Spacings.sm / 2 }],
  },
});
