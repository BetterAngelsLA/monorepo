import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
  omitMarginProps,
} from '@monorepo/expo/shared/static';
import { useRef } from 'react';
import {
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
    placeholderTextColor = Colors.NEUTRAL,
    ...rest
  } = props;

  // read before stripping margin props
  const { multiline = false } = rest as TextInputProps;

  const inputRef = useRef<TextInput>(null);
  const nonMarginOtherProps = omitMarginProps(rest);
  const asSelectProps = asSelect ? defaultAsSelectProps : {};

  const stringValue = typeof value === 'string' ? value : '';
  const isEmpty = stringValue === '';
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
            // row owns vertical alignment; wrapper will center single-line
            alignItems: multiline ? 'flex-start' : 'center',
            paddingTop: multiline ? Spacings.xs : 0,
            paddingBottom: multiline ? Spacings.xs : 0,
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

        {/* centering wrapper: no math, no specs */}
        <View
          style={{
            flex: 1,
            justifyContent: multiline ? 'flex-start' : 'center',
          }}
        >
          <TextInput
            ref={inputRef}
            multiline={multiline}
            numberOfLines={multiline ? undefined : 1}
            allowFontScaling={multiline ? true : false}
            editable={!disabled}
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            placeholderTextColor={placeholderTextColor}
            value={stringValue}
            {...asSelectProps}
            {...nonMarginOtherProps}
            style={[
              styles.inputText,
              {
                // natural single-line height: no vertical padding/height/lineHeight
                paddingTop: 0,
                paddingBottom: 0,
                color,
                // Android helpers; ignored on iOS
                includeFontPadding: false,
                textAlignVertical: multiline ? 'top' : 'center',
              },
              inputStyle,
            ]}
          />
        </View>

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
  input: {
    position: 'relative',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputText: {
    flex: 1,
    paddingHorizontal: Spacings.sm,
    fontFamily: 'Poppins-Regular',
    fontSize: FontSizes.md.fontSize,
  },
});
