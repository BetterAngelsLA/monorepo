import { PlusIcon } from '@monorepo/expo/shared/icons';
import {
  Colors,
  FontSizes,
  Radiuses,
  Spacings,
} from '@monorepo/expo/shared/static';
import { Control, Controller, ValidationValueMessage } from 'react-hook-form';
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

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
interface ITextareaProps extends TextInputProps {
  label?: string;
  control: Control<any>;
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
  height?: number | 'auto';
  onFocus?: () => void;
}

export function Textarea(props: ITextareaProps) {
  const {
    label,
    control,
    rules,
    name,
    error,
    required,
    disabled,
    componentStyle,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    height,
    onFocus,
    textAlignVertical = 'top',
    ...rest
  } = props;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onBlur, onChange } }) => (
        <View
          style={[
            styles.TextareaContainer,
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
              styles.Textarea,
              {
                borderColor: error ? 'red' : Colors.NEUTRAL_LIGHT,
              },
            ]}
          >
            <TextInput
              textAlignVertical={textAlignVertical}
              style={{
                color: disabled
                  ? Colors.NEUTRAL_LIGHT
                  : Colors.PRIMARY_EXTRA_DARK,

                paddingVertical: Spacings.sm,
                paddingLeft: Spacings.sm,
                paddingRight: Spacings.lg,
                fontFamily: 'Poppins-Regular',
                fontSize: FontSizes.md.fontSize,
                lineHeight: FontSizes.md.lineHeight,
                minHeight: 40,
                height,
                overflow: 'scroll',
                ...Platform.select({
                  web: {
                    outline: 'none',
                  },
                }),
              }}
              multiline
              value={value}
              onBlur={onBlur}
              onFocus={onFocus}
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
  TextareaContainer: {
    position: 'relative',
    width: '100%',
  },
  Textarea: {
    position: 'relative',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
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
    top: Spacings.xs,
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
