import { PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { Control, Controller, RegisterOptions } from 'react-hook-form';
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

type TRules = Omit<
  RegisterOptions,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IInputProps extends TextInputProps {
  label?: string;
  control?: Control<any>;
  height?: 40 | 56 | 200;
  name: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  rules?: TRules;
  componentStyle?: StyleProp<ViewStyle>;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
  onBlur?: () => void;
  icon?: ReactNode;
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
    height = 56,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    icon,
    ...rest
  } = props;

  const handleBlur = (onBlur: () => void) => {
    onBlur();
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onBlur, onChange } }) => (
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
                borderColor: error ? 'red' : Colors.NEUTRAL_LIGHT,
              },
            ]}
          >
            {icon && icon}
            <TextInput
              style={{
                color: disabled
                  ? Colors.NEUTRAL_LIGHT
                  : Colors.PRIMARY_EXTRA_DARK,
                paddingLeft: icon ? Spacings.xs : Spacings.sm,
                paddingRight: 38,
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
              value={value}
              onBlur={() => handleBlur(onBlur)}
              onChangeText={onChange}
              editable={!disabled}
              {...rest}
            />
            {value && (
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel="delete icon"
                accessibilityHint="deletes input's value"
                onPress={() => onChange('')}
                style={styles.pressable}
              >
                <View style={styles.icon}>
                  <PlusIcon size="xs" rotate="45deg" />
                </View>
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
  },
  input: {
    position: 'relative',
    fontFamily: 'Poppins-Regular',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
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
