import { Colors, FontSizes, Spacings } from '@monorepo/expo/shared/static';
import { Control, Controller, ValidationValueMessage } from 'react-hook-form';
import {
  Platform,
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

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ITextareaProps {
  label?: string;
  control: Control<any>;
  height?: 200;
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
  textAreaChanged?: boolean;
  setTextAreaChanged?: (e: boolean) => void;
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
    height = 200,
    mb,
    mt,
    my,
    mx,
    ml,
    mr,
    textAreaChanged,
    setTextAreaChanged,
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
                borderColor: error ? 'red' : Colors.PRIMARY_EXTRA_DARK,
              },
            ]}
          >
            <TextInput
              style={{
                color: disabled ? Colors.NEUTRAL_LIGHT : 'black',
                paddingHorizontal: Spacings.sm,
                fontFamily: 'Poppins-Regular',
                fontSize: FontSizes.md.fontSize,
                lineHeight: FontSizes.md.lineHeight,
                height,
                ...Platform.select({
                  web: {
                    outline: 'none',
                  },
                }),
              }}
              multiline
              value={value}
              onBlur={onBlur}
              onChangeText={(e) => {
                if (!textAreaChanged) {
                  if (setTextAreaChanged) {
                    setTextAreaChanged(true);
                  }
                }
                onChange(e);
              }}
              editable={!disabled}
              {...rest}
            />
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
    maxWidth: 600,
  },
  Textarea: {
    position: 'relative',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
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
