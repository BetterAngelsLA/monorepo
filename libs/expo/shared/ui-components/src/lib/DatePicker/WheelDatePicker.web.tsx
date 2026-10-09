import { CalendarLineIcon, ClockIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  getMarginStyles,
  omitMarginProps,
} from '@monorepo/expo/shared/static';
import {
  format as dateFnsFormat,
  isValid,
  parse as dateFnsParse,
} from 'date-fns';
import {
  type ChangeEvent,
  type CSSProperties,
  useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input';
import { IWheelDatePickerProps } from './types';

/**
 * Web build of {@link WheelDatePicker}.
 *
 * `@react-native-community/datetimepicker` is a native view with no browser
 * build. Rather than reimplement a wheel, this layers a transparent native
 * `<input type="date" | "time">` over the existing field chrome: the browser
 * supplies its own accessible picker (and keyboard entry), while the label,
 * error state, icon and margins stay identical to native.
 */
const INPUT_VALUE_FORMAT = {
  date: 'yyyy-MM-dd',
  time: 'HH:mm',
} as const;

const FIELD_HEIGHT = 56;

export function WheelDatePicker(props: IWheelDatePickerProps) {
  const {
    label,
    onChange,
    error,
    style,
    minDate,
    maxDate,
    mode,
    format,
    value,
    disabled,
    onBlur,
    testId,
    ...rest
  } = props;

  const nonMarginOtherProps = omitMarginProps(rest);

  const inputValueFormat = INPUT_VALUE_FORMAT[mode];
  const inputValue =
    value && isValid(value) ? dateFnsFormat(value, inputValueFormat) : '';

  const toInputValue = (date?: Date) =>
    date && isValid(date) ? dateFnsFormat(date, inputValueFormat) : undefined;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;

      // Clearing the native input must not silently wipe a required value; the
      // numeric variant owns clear-button behaviour via `onDelete`.
      if (!raw) return;

      const parsed = dateFnsParse(raw, inputValueFormat, new Date());
      if (!isValid(parsed)) return;

      // Preserve the half of the value the user did not edit. Changing only the
      // time should not reset the date, and vice versa.
      //
      // With no prior value `base` is "now", so a date-only pick carries the
      // current clock time. That is deliberate: native seeds its picker with
      // `value || new Date()` (WheelDatePicker.tsx) and passes the picker's Date
      // straight through, so it does the same. Do not "fix" this to midnight
      // without checking both platforms first.
      const base = value && isValid(value) ? value : new Date();
      const next = new Date(parsed);

      if (mode === 'time') {
        next.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
      } else {
        next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      }

      onChange(next);
    },
    [inputValueFormat, mode, onChange, value],
  );

  return (
    <View style={[styles.container, { ...getMarginStyles(props) }, style]}>
      <View style={styles.fieldWrapper}>
        <Input
          asSelect
          value={value ? dateFnsFormat(value, format) : undefined}
          label={label}
          error={!!error}
          errorMessage={error}
          slotRight={{
            focusableInput: false,
            component: <FieldIcon mode={mode} />,
            accessibilityLabel: 'date selector',
            accessibilityHint: `opens date selector for ${label || 'date field'}`,
          }}
          {...nonMarginOtherProps}
        />

        {!disabled && (
          <input
            type={mode === 'time' ? 'time' : 'date'}
            value={inputValue}
            min={toInputValue(minDate)}
            max={toInputValue(maxDate)}
            onChange={handleChange}
            onBlur={onBlur}
            data-testid={testId}
            aria-label={label}
            style={nativeInputStyle}
          />
        )}
      </View>
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
  fieldWrapper: {
    position: 'relative',
  },
});

/**
 * Style for the transparent click target covering the field.
 *
 * Kept as `CSSProperties` rather than a `StyleSheet` entry because it lands on a
 * real `<input>`: `border: 'none'` and `cursor: 'pointer'` are CSS, not React
 * Native style props, and `StyleSheet.create` rejects them.
 *
 * `opacity: 0` rather than `display: none` so the browser still owns focus and
 * the picker affordance.
 */
const nativeInputStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: FIELD_HEIGHT,
  opacity: 0,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
};
