import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { ComponentProps } from 'react';
import { View } from 'react-native';
import { DatePickerInput } from 'react-native-paper-dates';
import FormFieldLabel from '../FormFieldLabel';

type IDatePickerProps = Omit<
  ComponentProps<typeof DatePickerInput>,
  | 'locale'
  | 'inputMode'
  | 'mode'
  | 'iconColor'
  | 'textColor'
  | 'outlineColor'
  | 'outlineStyle'
  | 'withDateFormatInLabel'
>;

export function DatePicker(props: IDatePickerProps) {
  const { label, ...rest } = props;

  return (
    <View>
      {typeof label === 'string' && <FormFieldLabel label={label} />}
      <DatePickerInput
        locale="en"
        inputMode="start"
        mode="outlined"
        iconColor={Colors.PRIMARY_EXTRA_DARK}
        textColor={Colors.PRIMARY_EXTRA_DARK}
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
        {...rest}
      />
    </View>
  );
}
