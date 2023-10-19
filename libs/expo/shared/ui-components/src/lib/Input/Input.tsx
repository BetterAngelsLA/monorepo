import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { colors } from '@monorepo/expo/shared/static';
import {
  Control,
  Controller,
  FieldValues,
  ValidationValueMessage,
} from 'react-hook-form';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

type TValidateFn = (
  data: unknown
) => boolean | string | Promise<boolean | string>;

type TRules = {
  required?: boolean | string | ValidationValueMessage<string>;
  min?: number | string | ValidationValueMessage<number | string>;
  max?: number | string | ValidationValueMessage<number | string>;
  maxLength?: number | string | ValidationValueMessage<number | string>;
  minLength?: number | string | ValidationValueMessage<number | string>;
  pattern?: RegExp | { value: RegExp; message: string };
  validate?:
    | TValidateFn
    | Record<string, TValidateFn>
    | { value: TValidateFn; message: string };
};

interface IInputProps {
  label: string;
  control: Control<FieldValues>;
  height: 40 | 56;
  name: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  rules?: TRules;
  componentStyle?: StyleProp<ViewStyle>;
}

export function Input(props: IInputProps) {
  const {
    label,
    control,
    rules,
    name,
    error,
    required,
    disabled,
    componentStyle,
    height,
    ...rest
  } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onBlur, onChange } }) => (
        <View style={[styles.inputContainer, componentStyle]}>
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
                borderColor: error ? 'red' : colors.darkBlue,
              },
            ]}
          >
            <TextInput
              style={{
                color: disabled ? colors.gray : 'black',
                paddingLeft: 16,
                paddingRight: 38,
                height,
                ...Platform.select({
                  web: {
                    outline: 'none',
                  },
                }),
              }}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!disabled}
              {...rest}
            />
            {value && (
              <Pressable onPress={() => onChange('')} style={styles.icon}>
                <XmarkIcon color={colors.darkBlue} size="xs" />
              </Pressable>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
  },
  input: {
    position: 'relative',
    fontFamily: 'Pragmatica-medium',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: 'center',
  },
  label: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: colors.darkBlue,
    textTransform: 'capitalize',
    fontFamily: 'Pragmatica-medium',
  },
  required: {
    marginLeft: 2,
    color: 'red',
  },
  icon: {
    position: 'absolute',
    right: 16,
    height: 16,
    width: 16,
    backgroundColor: colors.gray,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
