import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import { HelperText } from 'react-native-paper'; // Import HelperText
import { DatePickerInput } from 'react-native-paper-dates';
import FormFieldLabel from '../FormFieldLabel';
import { INumericDatePickerProps } from './types';

// Add helperText and errorMessage to your interface if not already there
interface ExtendedProps extends INumericDatePickerProps {
  helperText?: string;
  errorMessage?: string;
}

export function NumericDatePicker(props: ExtendedProps) {
  const {
    label,
    disabled,
    value,
    onChange,
    errorMessage, // receive the error message
    helperText, // receive the helper text
    ...rest
  } = props;

  // Determine if we are in an error state
  const hasError = !!errorMessage;

  return (
    <View>
      {typeof label === 'string' && <FormFieldLabel label={label} />}

      <DatePickerInput
        locale="en"
        inputMode="start"
        mode="outlined"
        value={value}
        onChange={onChange}
        // Fix: Use the actual prop, don't hardcode true
        disabled={disabled}
        // Pass error state to the input styling
        hasError={hasError}
        iconColor={Colors.PRIMARY_EXTRA_DARK}
        textColor={disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK}
        outlineColor={hasError ? Colors.ERROR : Colors.NEUTRAL_LIGHT}
        activeOutlineColor={hasError ? Colors.ERROR : Colors.PRIMARY}
        outlineStyle={{
          borderRadius: Radiuses.xs,
          borderWidth: 1,
          borderColor: hasError ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
        }}
        withDateFormatInLabel={false}
        style={{
          width: '100%',
          height: 56,
          backgroundColor: disabled ? '#f0f0f0' : 'white', // Optional: visually grey out background
        }}
        {...rest}
      />

      {/* Render Helper Text or Error Message */}
      {(hasError || helperText) && (
        <HelperText type={hasError ? 'error' : 'info'} visible={true}>
          {errorMessage || helperText}
        </HelperText>
      )}
    </View>
  );
}
