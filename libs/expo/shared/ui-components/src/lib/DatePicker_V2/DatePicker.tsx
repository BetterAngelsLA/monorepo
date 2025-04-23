import { CalendarLineIcon, ClockIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
} from '@monorepo/expo/shared/static';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format as dateFnsFormat } from 'date-fns';
import { useState } from 'react';
import { RegisterOptions } from 'react-hook-form';
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

interface IDatePickerProps extends TMarginProps {
  label?: string;
  mode: 'date' | 'time';
  height?: 40 | 56 | 200;
  placeholder?: string;
  required?: boolean;
  pattern?: RegExp;
  disabled?: boolean;
  error?: boolean;
  rules?: TRules;
  format: string;
  componentStyle?: StyleProp<ViewStyle>;
  onBlur?: () => void;
  minDate?: Date;
  maxDate?: Date;
  pickerMode?: 'countdown' | 'date' | 'time' | 'datetime';
  onChange: (date: Date) => void;
  initialDate?: Date;
  value?: Date | null;
}

export function DatePicker(props: IDatePickerProps) {
  const {
    label,
    onChange,
    error,
    required,
    disabled,
    componentStyle,
    height = 56,
    minDate,
    maxDate,
    mode,
    placeholder,
    format = 'MM/dd/yyyy',
    pattern,
    initialDate,
    value,
    ...rest
  } = props;

  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View
      style={[
        styles.inputContainer,
        componentStyle,
        {
          ...getMarginStyles(props),
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
          placeholder={placeholder}
          maxLength={18}
          style={[
            styles.textInput,
            {
              height,
              ...Platform.select({
                web: {
                  outline: 'none',
                },
              }),
            },
          ]}
          value={value ? dateFnsFormat(value, format) : undefined}
          editable={!disabled}
          {...rest}
        />
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel="open date picker"
          accessibilityHint="Opens the date picker to select a date"
          onPress={() => {
            setPickerVisible(true);
            Keyboard.dismiss();
          }}
          style={styles.icon}
        >
          <FieldIcon mode={mode} />
        </Pressable>
      </View>
      {pickerVisible && (
        <View style={{ marginTop: Spacings.xs }}>
          <DateTimePicker
            locale={'en_US'}
            onChange={(event, date) => {
              if (event.type === 'dismissed' || !date) {
                return setPickerVisible(false);
              }

              onChange(date);

              if (Platform.OS !== 'ios') {
                setPickerVisible(false);
              }
            }}
            style={styles.dateTimePicker}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            mode={mode}
            minimumDate={minDate}
            maximumDate={maxDate}
            value={value || new Date()}
          />
          {Platform.OS === 'ios' && (
            <View style={{ marginTop: Spacings.xs }}>
              <Button
                style={{ alignSelf: 'flex-end' }}
                variant="primary"
                size="sm"
                height="sm"
                accessibilityHint="save date"
                onPress={() => {
                  setPickerVisible(false);
                }}
                title="Done"
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function FieldIcon({ mode }: { mode: 'date' | 'time' }) {
  if (mode === 'time') {
    return <ClockIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />;
  }

  return <CalendarLineIcon color={Colors.PRIMARY_EXTRA_DARK} size="md" />;
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    position: 'relative',
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    justifyContent: 'center',
  },
  textInput: {
    color: Colors.PRIMARY_EXTRA_DARK,
    paddingLeft: Spacings.sm,
    paddingRight: 38,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
  },
  dateTimePicker: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    overflow: 'hidden',
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
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: Spacings.sm,
  },
});
