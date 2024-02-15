import { CalendarIcon } from '@monorepo/expo/shared/icons';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import DatePicker from '@react-native-community/datetimepicker';
import { format, setHours, setMinutes } from 'date-fns';
import { useState } from 'react';
import { Control, Controller, RegisterOptions } from 'react-hook-form';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import Button from '../Button';

type TRules = Omit<
  RegisterOptions,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IDateTimePickerProps {
  label?: string;
  control: Control<any>;
  height?: 40 | 56 | 200;
  name: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  rules?: TRules;
  componentStyle?: StyleProp<ViewStyle>;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  onBlur?: () => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimePicker(props: IDateTimePickerProps) {
  const {
    label,
    control,
    name,
    error,
    required,
    disabled,
    componentStyle,
    height = 56,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    minDate,
    maxDate,
    ...rest
  } = props;

  const [picker, setPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const handleBlur = (onBlur: () => void) => {
    onBlur();
    if (props.onBlur) {
      props.onBlur();
    }
  };

  function setDate(
    onChange: { (...event: any[]): void; (): void },
    date: Date | undefined
  ) {
    setPicker(false);
    if (date) {
      const formattedDate = format(date, 'MM/dd/yy @ HH:mm');
      onChange(formattedDate);
    }
  }

  const handleChange = (date: Date, onChange: any) => {
    if (Platform.OS === 'ios') {
      setPickerDate(date || new Date());
    } else {
      if (mode === 'date') {
        setPickerDate(date || new Date());
        setMode('time');
      } else if (mode === 'time') {
        const mixed = setMinutes(
          setHours(pickerDate, date.getHours()),
          date.getMinutes()
        );
        setPicker(false);
        setMode('date');
        setDate(onChange, mixed);
      }
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required,
        pattern:
          /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4} @ (0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/,
      }}
      render={({ field: { value, onBlur, onChange } }) => (
        <View
          style={[
            styles.inputContainer,
            componentStyle,
            {
              marginBottom: mb && Spacings[mb],
              marginTop: mt && Spacings[mt],
              marginLeft: ml && Spacings[ml],
              marginRight: mr && Spacings[mr],
              marginHorizontal: mx && Spacings[mx],
              marginVertical: my && Spacings[my],
            },
          ]}
        >
          {label && (
            <View style={styles.label}>
              <Text style={styles.labelText}>{label}</Text>
              {required && <Text style={styles.required}>*</Text>}
            </View>
          )}
          <View
            style={[
              styles.input,
              {
                borderColor: error ? 'red' : Colors.NEUTRAL_LIGHT,
              },
            ]}
          >
            <TextInput
              placeholder={format(new Date(), 'MM/dd/yy @ HH:mm')}
              maxLength={18}
              style={{
                color: disabled
                  ? Colors.NEUTRAL_LIGHT
                  : Colors.PRIMARY_EXTRA_DARK,
                paddingLeft: 16,
                paddingRight: 38,
                fontFamily: 'Poppins-Regular',
                fontSize: 16,
                height,
                ...Platform.select({
                  web: {
                    outline: 'none',
                  },
                }),
              }}
              value={value}
              onBlur={() => handleBlur(onBlur)}
              onChangeText={(e) => {
                onChange(e);
              }}
              editable={!disabled}
              {...rest}
            />
            <Pressable
              accessible
              accessibilityRole="button"
              accessibilityLabel="open date picker"
              accessibilityHint="Opens the date picker to select a date and time"
              onPress={() => {
                value && setPicker(value);
                setPicker(true);
                Keyboard.dismiss();
              }}
              style={styles.icon}
            >
              <CalendarIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
            </Pressable>
          </View>
          {picker && (
            <View style={{ marginTop: Spacings.xs }}>
              <DatePicker
                onChange={(event, date) => {
                  if (event.type === 'dismissed' || !date) {
                    setMode('date');
                    return setPicker(false);
                  }
                  handleChange(date, onChange);
                }}
                style={{
                  backgroundColor: Colors.WHITE,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                mode={Platform.OS === 'ios' ? 'datetime' : mode}
                minimumDate={minDate}
                maximumDate={maxDate}
                value={pickerDate}
              />
              {Platform.OS === 'ios' && (
                <Button
                  mt="xs"
                  style={{ alignSelf: 'flex-end' }}
                  variant="primary"
                  size="sm"
                  height="sm"
                  accessibilityHint="save date"
                  onPress={() => {
                    setDate(onChange, pickerDate);
                  }}
                  title="Done"
                />
              )}
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
  },
  input: {
    position: 'relative',
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
  },
  label: {
    flexDirection: 'row',
    marginBottom: Spacings.xs,
  },
  labelText: {
    fontSize: FontSizes.sm.fontSize,
    lineHeight: FontSizes.sm.lineHeight,
    color: Colors.PRIMARY_EXTRA_DARK,
    fontFamily: 'Poppins-Regular',
  },
  required: {
    marginLeft: 2,
    color: 'red',
  },
  icon: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
});
