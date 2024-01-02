import { CalendarIcon } from '@monorepo/expo/shared/icons';
import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { useState } from 'react';
import { Control, Controller, RegisterOptions } from 'react-hook-form';
import {
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

function hexToRGBA(hex: string, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type TRules = Omit<
  RegisterOptions,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IDatePickerProps {
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
}

export function DatePicker(props: IDatePickerProps) {
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
    ...rest
  } = props;

  const [picker, setPicker] = useState(false);

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
      const formattedDate = format(date, 'MM/dd/yy');
      onChange(formattedDate);
    }
  }

  const formatDate = (input: string) => {
    let formattedInput = input.replace(/[^0-9]/g, '');

    if (formattedInput.length > 2) {
      let month = formattedInput.slice(0, 2);
      month = parseInt(month) > 12 ? '12' : month;
      formattedInput = `${month}/${formattedInput.slice(2)}`;
    }

    if (formattedInput.length > 5) {
      let day = formattedInput.slice(3, 5);
      day = parseInt(day) > 31 ? '31' : day;
      formattedInput = `${formattedInput.slice(
        0,
        3
      )}${day}/${formattedInput.slice(5, 7)}`;
    }

    return formattedInput;
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required,
        pattern: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{2}$/,
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
                borderColor: error ? 'red' : Colors.PRIMARY_EXTRA_DARK,
              },
            ]}
          >
            <TextInput
              keyboardType="number-pad"
              maxLength={8}
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
                const formattedText = formatDate(e);
                console.log(formattedText);
                onChange(formattedText);
              }}
              editable={!disabled}
              {...rest}
            />
            <Pressable
              accessible
              accessibilityRole="button"
              accessibilityLabel="delete icon"
              accessibilityHint="deletes input's value"
              onPress={() => setPicker(true)}
              style={styles.icon}
            >
              <CalendarIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
            </Pressable>
          </View>
          <Modal
            transparent={true}
            visible={picker}
            onRequestClose={() => setPicker(false)}
          >
            <Pressable
              accessible
              accessibilityHint="date picker popup closing background"
              onPress={() => setPicker(false)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                backgroundColor: hexToRGBA(Colors.BLACK, 0.15),
              }}
            >
              <DateTimePicker
                onChange={(event, date) => setDate(onChange, date)}
                style={{ backgroundColor: Colors.WHITE }}
                display="inline"
                mode="date"
                minimumDate={new Date()}
                value={
                  value ? parse(value, 'MM/dd/yy', new Date()) : new Date()
                }
              />
            </Pressable>
          </Modal>
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
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Regular',
  },
  required: {
    marginLeft: 2,
    color: 'red',
  },
  icon: {
    position: 'absolute',
    right: 16,
  },
});
