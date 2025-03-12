import { PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
  TSpacing,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import TextRegular from '../TextRegular';

export interface IInputProps extends TextInputProps {
  label?: string;
  height?: number;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  componentStyle?: StyleProp<ViewStyle>;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  icon?: ReactNode;
  onDelete?: () => void;
  borderRadius?: number;
}

export function Input(props: IInputProps) {
  const {
    label,
    error,
    required,
    disabled,
    componentStyle,
    height = 38,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    icon,
    value,
    onDelete,
    autoCorrect = true,
    borderRadius = Radiuses.xs,
    errorMessage,
    ...rest
  } = props;

  return (
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
            paddingLeft: icon ? Spacings.sm : 0,
            borderColor: error ? Colors.ERROR : Colors.NEUTRAL_LIGHT,
            borderRadius,
          },
        ]}
      >
        {icon}
        <TextInput
          style={{
            color: disabled ? Colors.NEUTRAL_LIGHT : Colors.PRIMARY_EXTRA_DARK,
            paddingLeft: icon ? Spacings.xs : Spacings.sm,
            paddingRight: onDelete ? 38 : Spacings.sm,
            flex: 1,
            fontFamily: 'Poppins-Regular',
            fontSize: FontSizes.md.fontSize,
            height,
            ...Platform.select({
              web: {
                outline: 'none',
              },
            }),
          }}
          editable={!disabled}
          autoCorrect={autoCorrect}
          {...rest}
          value={value}
        />
        {value && onDelete && (
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel="delete icon"
            accessibilityHint="deletes input's value"
            onPress={onDelete}
            style={styles.pressable}
          >
            <View style={styles.icon}>
              <PlusIcon size="xs" rotate="45deg" />
            </View>
          </Pressable>
        )}
      </View>
      {errorMessage && (
        <TextRegular mt="xxs" size="sm" color={Colors.ERROR}>
          {errorMessage}
        </TextRegular>
      )}
    </View>
  );
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
    alignItems: 'center',
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
  pressable: {
    position: 'absolute',
    right: Spacings.xs,
    height: Spacings.lg,
    width: Spacings.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    height: Spacings.sm,
    width: Spacings.sm,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
