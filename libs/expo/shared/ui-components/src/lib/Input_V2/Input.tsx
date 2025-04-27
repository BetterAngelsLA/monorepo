import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TMarginProps,
  getMarginStyles,
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
  asPicker?: boolean;
}

const defaultAsPickerProps: TextInputProps = {
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
    asPicker,
    ...rest
  } = props;
  const inputRef = useRef<TextInput>(null);
  const asPickerProps = asPicker ? defaultAsPickerProps : {};

  return (
    <View
      style={[
        styles.container,
        style,
        {
          ...getMarginStyles(props),
        },
      ]}
    >
      {label && <FormFieldLabel label={label} required={required} />}
      <View
        style={[
          styles.input,
          {
            // borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
            borderColor: 'green',
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
            {
              color: disabled
                ? Colors.NEUTRAL_LIGHT
                : Colors.PRIMARY_EXTRA_DARK,
              paddingHorizontal: Spacings.sm,
              flex: 1,
              fontFamily: 'Poppins-Regular',
              fontSize: FontSizes.md.fontSize,
              paddingVertical: Spacings.sm,
              textAlignVertical: 'top',
              ...Platform.select({
                web: {
                  outline: 'none',
                },
              }),
            },
            inputStyle,
          ]}
          editable={!disabled}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          {...asPickerProps}
          {...rest}
          value={value}
        />

        {value && onDelete && (
          <InputSlot
            placement="right"
            disabled={disabled}
            onPress={onDelete}
            accessibilityLabel="clear input"
            accessibilityHint={`clear value for ${label || 'input'}`}
            component={<InputClearIcon />}
          />
        )}

        {asPicker && (
          <InputSlot
            placement="right"
            inputRef={inputRef}
            focusableInput={true}
            disabled={disabled}
            component={<ChevronLeftIcon size="sm" rotate={'-90deg'} />}
            accessibilityLabel={`selector for ${label || 'input'}`}
            accessibilityHint={`opens selector for ${label || 'input'}`}
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
    display: 'flex',
  },
  input: {
    position: 'relative',
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    flexDirection: 'row',
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
});
