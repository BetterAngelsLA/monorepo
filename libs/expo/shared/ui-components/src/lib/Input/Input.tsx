import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
  omitMarginProps,
} from '@monorepo/expo/shared/static';
import { useRef, type ReactNode, type RefObject } from 'react';
import {
  Platform,
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
   * Element rendered on top of the field box itself — the row that holds the
   * text input and the slots, not the label or the error line above and below
   * it. It fills that row, so the element can size itself with `100%` and needs
   * no knowledge of the field's height, which varies with font scale and with
   * whether a label is present.
   *
   * The web date/time fields use it to lay a transparent native `<input>` over
   * the chrome. Anything left uncovered stays interactive, so the text input
   * underneath is still reachable.
   */
  fieldOverlay?: ReactNode;
  /**
   * Lets a parent drive the field's focus. `Picker` needs it: on web it has to
   * drop focus off a select field after its modal closes, or the browser's
   * focus restore reopens the modal forever. Optional — the internal ref is used
   * when it is not given.
   */
  inputRef?: RefObject<TextInput | null>;
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
    inputRef: externalInputRef,
    placeholderTextColor = Colors.NEUTRAL,
    ...rest
  } = props;

  // Pull out multiline before we strip margin props (used to center text)
  const { multiline = false } = rest as TextInputProps;

  const internalInputRef = useRef<TextInput>(null);
  const inputRef = externalInputRef ?? internalInputRef;
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
          {...asSelectProps}
          {...nonMarginOtherProps}
        />

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
   * The overlay covers the field row exactly (the row is `position: relative`),
   * so an overlay element can size itself with `100%` and needs no knowledge of
   * the field's height — which varies with font scale, and with the error line.
   *
   * Written out rather than spread from `StyleSheet.absoluteFill`: react-native-web
   * compiles that one to a class map, so spreading it relies on `create` skipping
   * an object that already carries `$$css`. Explicit props read the same on both
   * platforms.
   *
   * `box-none` from the stylesheet, not the prop — react-native-web only
   * polyfills it through the atomic compiler, which is what `StyleSheet.create`
   * feeds. Anything the overlay leaves uncovered stays interactive, so the text
   * input underneath is still reachable.
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
    // See docs/outreach-web.md.
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
});
