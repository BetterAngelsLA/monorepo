import { CalendarLineIcon, ClockIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  getMarginStyles,
  omitMarginProps,
} from '@monorepo/expo/shared/static';
import { format as dateFnsFormat, isValid } from 'date-fns';
import { type ChangeEvent, type CSSProperties, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input';
import { mergePickedDate } from './mergePickedDate';
import { IWheelDatePickerProps } from './types';

/**
 * Web build of {@link WheelDatePicker}.
 *
 * `@react-native-community/datetimepicker` is a native view with no browser
 * build. Rather than reimplement a wheel, this layers a transparent native
 * `<input type="date" | "time">` over the existing field chrome: the browser
 * supplies its own accessible picker (and keyboard entry), while the label,
 * error state, icon and margins stay identical to native.
 *
 * The `<input>` is handed to `Input` as `fieldOverlay`, which fills the field
 * row exactly. It is not positioned from the outside: the row's height varies
 * (font scale, the error line) and with a `label` an overlay anchored to the
 * wrapper would cover the label and leave the bottom of the field dead.
 */
const INPUT_VALUE_FORMAT = {
  date: 'yyyy-MM-dd',
  time: 'HH:mm',
} as const;

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
      const next = mergePickedDate(
        event.target.value,
        mode,
        value,
        new Date(),
        inputValueFormat,
      );

      if (next) {
        onChange(next);
      }
    },
    [inputValueFormat, mode, onChange, value],
  );

  // A disabled field gets no overlay, so the native control cannot be opened.
  const fieldOverlay = disabled ? undefined : (
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
  );

  return (
    <View style={[styles.container, { ...getMarginStyles(props) }, style]}>
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
        fieldOverlay={fieldOverlay}
        {...nonMarginOtherProps}
      />
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
});

/**
 * Style for the transparent click target covering the field.
 *
 * Kept as `CSSProperties` rather than a `StyleSheet` entry because it lands on a
 * real `<input>`: `border: 'none'` and `cursor: 'pointer'` are CSS, not React
 * Native style props, and `StyleSheet.create` rejects them.
 *
 * Fills the overlay box `Input` provides, so no height is hard-coded.
 *
 * `opacity: 0` rather than `display: none` so the browser still owns focus and
 * the picker affordance.
 */
const nativeInputStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
};
