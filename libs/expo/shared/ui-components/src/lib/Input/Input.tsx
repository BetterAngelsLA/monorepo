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
}

const defaultAsSelectProps: TextInputProps = {
  showSoftInputOnFocus: false,
  caretHidden: true,
};

const baseTextInputStyle = {
  paddingHorizontal: Spacings.sm,
  paddingVertical: Spacings.sm,
  flex: 1,
  fontFamily: 'Poppins-Regular' as const,
  fontSize: FontSizes.md.fontSize,
  includeFontPadding: false,
  textAlignVertical: 'top' as const,
  ...Platform.select({ web: { outline: 'none' as const } }),
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

  const inputRef = useRef<TextInput>(null);
  const nonMarginOtherProps = omitMarginProps(rest);
  const asSelectProps = asSelect ? defaultAsSelectProps : {};

  const inputProps: TextInputProps = {
    editable: !disabled,
    autoCorrect,
    autoCapitalize,
    placeholderTextColor,
    ...asSelectProps,
    ...nonMarginOtherProps,
    value: value ?? '',
  };

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
            baseTextInputStyle,
            {
              color: disabled
                ? Colors.NEUTRAL_LIGHT
                : Colors.PRIMARY_EXTRA_DARK,
            },
            inputStyle,
          ]}
          {...inputProps}
        />

        {!!value && onDelete && (
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
});
