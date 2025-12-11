import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { View } from 'react-native';
import { DatePickerInput } from 'react-native-paper-dates';
import FormFieldLabel from '../FormFieldLabel';
import { INumericDatePickerProps } from './types';

export function NumericDatePicker(props: INumericDatePickerProps) {
  const { label, disabled, ...rest } = props;

  return (
    <View>
      {typeof label === 'string' && <FormFieldLabel label={label} />}
      <DatePickerInput
        locale="en"
        inputMode="start"
        mode="outlined"
        disabled={disabled}
        iconColor={disabled ? Colors.NEUTRAL : Colors.PRIMARY_EXTRA_DARK}
        textColor={disabled ? Colors.NEUTRAL : Colors.PRIMARY_EXTRA_DARK}
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
          backgroundColor: disabled ? Colors.NEUTRAL_EXTRA_LIGHT : Colors.WHITE,
        }}
        {...rest}
      />
    </View>
  );
}
