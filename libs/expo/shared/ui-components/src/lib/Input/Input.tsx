import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
  omitMarginProps,
} from '@monorepo/expo/shared/static';
import { useRef, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import FormFieldError from '../FormFieldError';
import FormFieldLabel from '../FormFieldLabel';
import { InputClearIcon } from './InputClearIcon';
import { InputSlot, TInputSlot } from './InputSlot';

export interface IInputProps extends TMarginProps, TextInputProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  onDelete?: () => void;
  slotLeft?: TInputSlot;
  slotRight?: TInputSlot;
  asSelect?: boolean;
  /**
   * Fills the field row — the row holding the input and the slots, not the label
   * or the error line. An overlay can size itself with `100%`; anything it leaves
   * uncovered stays interactive. The web date/time fields use it for their
   * transparent `<input>`.
   */
  fieldOverlay?: ReactNode;
  /**
   * Makes the field a press target instead of something you type into: the input
   * stays as display, leaves the tab order, and a target over the row reports the
   * press. Use it for a select — a button, not a text field. `Picker` opens its
   * modal from this rather than from `onFocus`, which react-native-web's Modal
   * re-fires on close.
   */
  onPress?: () => void;
}

const defaultAsSelectProps: TextInputProps = {
  showSoftInputOnFocus: false,
  caretHidden: true,
};

export function Input(props: IInputProps) {
  const {
    label,
    error,
    required,
    disabled,
    style,
    inputStyle,
    value,
    onDelete,
    slotLeft,
    slotRight,
    autoCorrect = false,
    autoCapitalize = 'none',
    borderRadius = Radiuses.xs,
    errorMessage,
    asSelect,
    fieldOverlay,
    onPress,
    placeholderTextColor = Colors.NEUTRAL,
    ...rest
  } = props;

  // Pull out multiline before we strip margin props (used to center text)
  const { multiline = false } = rest as TextInputProps;

  const inputRef = useRef<TextInput>(null);
  const nonMarginOtherProps = omitMarginProps(rest);
  const asSelectProps = asSelect ? defaultAsSelectProps : {};

  const isEmpty = (value ?? '') === '';
  const color = disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK;
  const showClear = !!onDelete && !isEmpty;

  return (
    <View style={[styles.container, style, getMarginStyles(props)]}>
      {label && <FormFieldLabel label={label} required={required} />}

      <View
        style={[
          styles.input,
          {
            borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
            borderRadius,
          },
        ]}
      >
        {slotLeft && (
          <InputSlot
            placement="left"
            disabled={disabled}
            inputRef={inputRef}
            {...slotLeft}
          />
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.inputText,
            { color, textAlignVertical: multiline ? 'top' : 'center' },
            inputStyle,
          ]}
          editable={!disabled}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={placeholderTextColor}
          value={value ?? ''}
          // A press-target field is reached through the target below, so it must
          // not be a second tab stop (or a focus entry point) of its own.
          focusable={onPress ? false : undefined}
          {...asSelectProps}
          {...nonMarginOtherProps}
        />

        {onPress && !disabled && (
          <Pressable
            style={styles.pressTarget}
            onPress={onPress}
            accessibilityRole="button"
            // The value belongs in the label: react-native-web only emits
            // `aria-valuetext` for value-bearing roles, not for a button.
            accessibilityLabel={[
              label,
              value ? String(value) : rest.placeholder,
            ]
              .filter(Boolean)
              .join(': ')}
            accessibilityHint={`opens options for ${label || 'field'}`}
          />
        )}

        {showClear && (
          <InputSlot
            placement="right"
            disabled={disabled}
            onPress={onDelete}
            accessibilityLabel="clear input"
            accessibilityHint={`clear value for ${label || 'input'}`}
            component={<InputClearIcon />}
          />
        )}

        {slotRight && (
          <InputSlot
            placement="right"
            disabled={disabled}
            inputRef={inputRef}
            {...slotRight}
          />
        )}

        {fieldOverlay && (
          <View style={styles.fieldOverlay}>{fieldOverlay}</View>
        )}
      </View>

      {errorMessage && <FormFieldError message={errorMessage} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  /**
   * Covers the field row. Rendered before the slots so they paint on top and keep
   * their own taps.
   */
  pressTarget: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  /**
   * Spelled out rather than spread from `StyleSheet.absoluteFill`, which
   * react-native-web compiles to a class map. `box-none` has to come from the
   * stylesheet as well: react-native-web only polyfills it through the atomic
   * compiler.
   */
  fieldOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'box-none',
  },
  input: {
    position: 'relative',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputText: {
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.sm,
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.xsm.fontSize,
    includeFontPadding: false,
    // `outlineWidth: 0`, not `outline: 'none'`: react-native-web's StyleSheet
    // validator rejects CSS shorthands and *deletes* them (dev only), so the
    // shorthand silently did nothing. `outlineStyle` is the literal translation
    // but React Native's own types only allow 'solid' | 'dotted' | 'dashed' for
    // it, so a zero width is the type-safe way to drop the focus ring.
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
});
