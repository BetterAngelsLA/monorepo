import { CalendarLineIcon, ClockIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
  omitMarginProps,
} from '@monorepo/expo/shared/static';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format as dateFnsFormat } from 'date-fns';
import { useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Button from '../Button';
import { Input } from '../Input';

interface IDatePickerProps extends TMarginProps {
  mode: 'date' | 'time';
  onChange: (date: Date) => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  format: string;
  onBlur?: () => void;
  minDate?: Date;
  maxDate?: Date;
  value?: Date | null;
}

export function DatePicker(props: IDatePickerProps) {
  const {
    label,
    onChange,
    error,
    style,
    minDate,
    maxDate,
    mode,
    format = 'MM/dd/yyyy',
    value,
    ...rest
  } = props;
  const [pickerVisible, setPickerVisible] = useState(false);

  const nonMarginOtherProps = omitMarginProps(rest);

  return (
    <View
      style={[
        styles.container,
        {
          ...getMarginStyles(props),
        },
        style,
      ]}
    >
      <Input
        asSelect
        value={value ? dateFnsFormat(value, format) : undefined}
        label={label}
        error={!!error}
        errorMessage={error}
        onFocus={() => {
          setPickerVisible(!pickerVisible);
          Keyboard.dismiss();
        }}
        slotRight={{
          focusableInput: true,
          component: <FieldIcon mode={mode} />,
          accessibilityLabel: 'date selector',
          accessibilityHint: `opens date selector for ${label || 'date field'}`,
        }}
        {...nonMarginOtherProps}
      />
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
  container: {
    width: '100%',
  },
  dateTimePicker: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    overflow: 'hidden',
  },
});
